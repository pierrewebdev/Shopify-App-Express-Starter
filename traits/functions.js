var crypto = require('crypto');
var RequestTrait = require('./requests');
var mysqlAPI = require("../src/mysql-api");
const { MailerSend, EmailParams, Sender, Recipient } = require("mailersend");

// const nodeCache = require('node-cache');
// const cacheInstance = new nodeCache();
module.exports = {

    //This will come into use later, in case you decide to use app proxies
    verifyProxyRequest: async function (query, clientSecret) {
        var data = new Array();
        var signature = query.signature;
        delete (query.signature);
        for (var key in query) {
            key = key.replace("%", "%25");
            key = key.replace("&", "%26");
            key = key.replace("=", "%3D");

            var val = query[key];
            val = val.replace("%", "%25");
            val = val.replace("&", "%26");
            data.push(key + '=' + val);
        }
        data = data.join('');
        //var data = "logged_in_customer_id="+query.logged_in_customer_id+"path_prefix="+query.path_prefix+"shop="+query.shop+"timestamp="+query.timestamp;
        let calculated_signature = crypto.createHmac('sha256', clientSecret).update(data).digest('hex')
        // console.log(signature);
        // console.log(calculated_signature);
        return signature == calculated_signature;
    },

    isRequestFromShopify: async function (req, clientSecret) {
        var hmac = req.hmac;
        delete (req.hmac);
        var data = new Array();
        for (var key in req) {
            key = key.replace("%", "%25");
            key = key.replace("&", "%26");
            key = key.replace("=", "%3D");

            var val = req[key];
            // console.log(val);
            val = val.replace("%", "%25");
            val = val.replace("&", "%26");
            data.push(key + '=' + val);
        }
        data = data.join('&');

        const genHash = crypto
            .createHmac("sha256", clientSecret)
            .update(data)
            .digest("hex");

        return genHash === hmac;
    },

    /**
     * @param {string} path 
     * @param {object} store
     * @returns {string} URL - Format the same as Shopify API URLs
     */
    getShopifyAPIURLForStore(path, store) {
        var API_VERSION = process.env.SHOPIFY_API_VERSION;
        if (API_VERSION.length < 1)
            API_VERSION = '2024-01';
        return `https://${store.myshopify_domain}/admin/api/${API_VERSION}/${path}`;
    },

    /**
     * @param {object} store 
     * @returns {object} headers - Used to make authenticated Shopify API calls
     */
    getShopifyAPIHeadersForStore(accessToken) {
        return {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": accessToken
        }
    },

    //used to save data when someone is first installing app
    async saveDetailsToDatabase(shopifyStore, accessToken) {
        try {
            const { hash } = require("bcryptjs");

            var storeBody = {
                "id": shopifyStore.id,
                "myshopify_domain": shopifyStore.domain,
                "name": shopifyStore.name,
                "accessToken": accessToken,
                "currency": shopifyStore.currency,
                "email": shopifyStore.email,
                "phone": shopifyStore.phone
            };

            var userBody = {
                "name": shopifyStore.name,
                "email": shopifyStore.email,
                "password": await hash('123456', 8)
            };

            //Find or Create DB Records using Models
            let storeRecord = await mysqlAPI.findStoreRecord(storeBody);

            if (!storeRecord) {
                storeRecord = await mysqlAPI.createStoreRecord(storeBody)
            }


            const userStoreRecord = await mysqlAPI.findUserWithStoreId(storeRecord);

            if (!userStoreRecord) {
                //create new admin and then create adminstore record for it
                const newUserRecord = await mysqlAPI.createUserRecord(userBody)
                const newUserStoreRecord = await mysqlAPI.createUserStoreMapping(storeRecord, newUserRecord)

            }

            //Any other operations here..just after installing the store

            return true;
        } catch (error) {
            console.log('error in saving details to database: ' + error.message);
        }
    },

    async getShopifyStoreDetails(query, accessToken) {
        var endpoint = this.getShopifyAPIURLForStore('shop.json', { "myshopify_domain": query.shop });
        var headers = this.getShopifyAPIHeadersForStore(accessToken);
        var response = await RequestTrait.makeAnAPICallToShopify('GET', endpoint, headers);

        console.log("HEADERS", headers)

        if (response.status)
            return response.respBody.shop;

        return null;
    },

    verifyWebhookRequest: async function (req, clientSecret) {
        try {
            let shopifyApiSecret = clientSecret;

            let hmac = req.headers["x-shopify-hmac-sha256"];
            const message = req.rawBody; //Set in server.js express.json() function
            const generatedHash = crypto
                .createHmac("sha256", shopifyApiSecret)
                .update(message)
                .digest("base64");

            const signatureOk = crypto.timingSafeEqual(
                Buffer.from(generatedHash),
                Buffer.from(hmac)
            );
            return { status: true, okay: signatureOk };
        } catch (error) {
            return { status: false, okay: false, error: error.message }
        }
    },


    async requestAccessTokenFromShopify(query, clientId, clientSecret) {
        var endpoint = `https://${query.shop}/admin/oauth/access_token`;
        var body = {
            'client_id': clientId,
            'client_secret': clientSecret,
            'code': query.code
        };

        var headers = {
            'Content-Type': 'application/json'
        };

        var response = await RequestTrait.makeAnAPICallToShopify('POST', endpoint, headers, body);

        if (response.status) {
            return response.respBody.access_token;
        }

        return null;
    },

    async checkStoreRecordValidity(dbRecord) {
        if (!dbRecord) { //Using !dbRecord checks for all undefined, null and empty checks
            return false;
        }

        var endpoint = this.getShopifyAPIURLForStore('shop.json', dbRecord);
        var headers = this.getShopifyAPIHeadersForStore(dbRecord);
        var response = await RequestTrait.makeAnAPICallToShopify('GET', endpoint, headers);
        return response.status && response.respBody.hasOwnProperty('shop');
    },

    //Helper function to get shopify id from GraphQL GID
    extractIdFromGid: function (gid) {
        const parts = gid.split('/');
        return parts[parts.length - 1];
    },

    sendInvoiceEmail: async function (emailData) {
        const { 
            orderName, 
            storeName, 
            lineItems, 
            customerEmail,
            customerName,
            invoiceSubjectLine, 
            customMessage 
        } = emailData

        const mailerSend = new MailerSend({
            apiKey: process.env.MAILER_SEND_API_KEY,
        });

        const sentFrom = new Sender("test@trial-v69oxl5njkzl785k.mlsender.net", "Patrick");

        const recipients = [
            new Recipient(customerEmail, customerName)
        ];

        const emailParams = new EmailParams()
            .setFrom(sentFrom)
            .setTo(recipients)
            .setReplyTo(sentFrom)
            .setSubject(invoiceSubjectLine)
            .setHtml(`
                <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
                <html lang="en" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:v="urn:schemas-microsoft-com:vml">
                <head>
                    <title></title>
                    <meta content="text/html; charset=utf-8" http-equiv="Content-Type">
                    <meta content="width=device-width, initial-scale=1.0" name="viewport">
                    <!--[if mso]>
                    <xml>
                        <o:OfficeDocumentSettings>
                            <o:PixelsPerInch>96</o:PixelsPerInch>
                            <o:AllowPNG/>
                        </o:OfficeDocumentSettings>
                    </xml>
                    <![endif]--><!--[if !mso]><!-->
                    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@100;200;300;400;500;600;700;800;900" rel="stylesheet" type="text/css">
                    <!--<![endif]-->
                    <style>
                        * {
                        box-sizing: border-box;
                        }
                        body {
                        margin: 0;
                        padding: 0;
                        }
                        a[x-apple-data-detectors] {
                        color: inherit !important;
                        text-decoration: inherit !important;
                        }
                        #MessageViewBody a {
                        color: inherit;
                        text-decoration: none;
                        }
                        p {
                        line-height: inherit
                        }
                        .desktop_hide,
                        .desktop_hide table {
                        mso-hide: all;
                        display: none;
                        max-height: 0px;
                        overflow: hidden;
                        }
                        .image_block img+div {
                        display: none;
                        }
                        sup,
                        sub {
                        line-height: 0;
                        font-size: 75%;
                        }
                        @media (max-width:720px) {
                        .desktop_hide table.icons-inner,
                        .social_block.desktop_hide .social-table {
                        display: inline-block !important;
                        }
                        .icons-inner {
                        text-align: center;
                        }
                        .icons-inner td {
                        margin: 0 auto;
                        }
                        .mobile_hide {
                        display: none;
                        }
                        .row-content {
                        width: 100% !important;
                        }
                        .stack .column {
                        width: 100%;
                        display: block;
                        }
                        .mobile_hide {
                        min-height: 0;
                        max-height: 0;
                        max-width: 0;
                        overflow: hidden;
                        font-size: 0px;
                        }
                        .desktop_hide,
                        .desktop_hide table {
                        display: table !important;
                        max-height: none !important;
                        }
                        }
                    </style>
                    <!--[if mso ]>
                    <style>sup, sub { font-size: 100% !important; } sup { mso-text-raise:10% } sub { mso-text-raise:-10% }</style>
                    <![endif]-->
                    <style type="text/css" id="operaUserStyle"></style>
                </head>
                <body class="body" style="background-color: #fbfbfb; margin: 0; padding: 0; -webkit-text-size-adjust: none; text-size-adjust: none;">
                    <table border="0" cellpadding="0" cellspacing="0" class="nl-container" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #fbfbfb;" width="100%">
                    <tbody>
                        <tr>
                            <td>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-radius: 0; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <h1 style="margin: 0; color: #1e0e4b; direction: ltr; font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 30px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 36px;"><span class="tinyMce-placeholder" style="word-break: break-word;">Invoice</span></h1>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <div class="spacer_block block-2" style="height:20px;line-height:20px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="10" cellspacing="0" class="heading_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <h1 style="margin: 0; color: #1e0e4b; direction: ltr; font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 18px; font-weight: 400; letter-spacing: normal; line-height: 120%; text-align: left; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 21.599999999999998px;"><span class="tinyMce-placeholder" style="word-break: break-word;">${storeName}</span></h1>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="0" cellspacing="0" class="empty_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div></div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div style="color:#444a5b;direction:ltr;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;font-weight:400;letter-spacing:0px;line-height:120%;text-align:right;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0; margin-bottom: 16px;">${invoiceSubjectLine}</p>
                                                                    <p style="margin: 0;">September 18th 2024</p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f4f4f4; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <div class="spacer_block block-1" style="height:35px;line-height:35px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:25px;padding-left:25px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:28px;line-height:120%;text-align:left;mso-line-height-alt:33.6px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Hi ${customerName}</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:25px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:18px;line-height:150%;text-align:left;mso-line-height-alt:27px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Here is an overview of your order from ${storeName}. Please use the button at the bottom of the email to complete your purchase.</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f4f4f4; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <div class="spacer_block block-1" style="height:35px;line-height:35px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:25px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:17px;line-height:120%;text-align:left;mso-line-height-alt:20.4px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Invoiced to:</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-3" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:25px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#848484;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:15px;line-height:120%;text-align:left;mso-line-height-alt:18px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">John Adams </span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:25px;padding-right:10px;padding-top:5px;">
                                                                <div style="color:#848484;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:15px;line-height:120%;text-align:left;mso-line-height-alt:18px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">55 Rue Chapon</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:25px;padding-right:10px;padding-top:5px;">
                                                                <div style="color:#848484;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:15px;line-height:120%;text-align:left;mso-line-height-alt:18px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">745067, Paris</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:25px;padding-right:10px;padding-top:5px;">
                                                                <div style="color:#848484;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:15px;line-height:120%;text-align:left;mso-line-height-alt:18px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">France</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:25px;padding-right:10px;padding-top:5px;">
                                                                <div style="color:#848484;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:15px;line-height:120%;text-align:left;mso-line-height-alt:18px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">VAT No: FR12345678</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <div class="spacer_block block-1" style="height:35px;line-height:35px;font-size:1px;"> </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-4" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f4f4f4; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <div class="spacer_block block-1" style="height:30px;line-height:30px;font-size:1px;"> </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <div class="spacer_block block-1" style="height:35px;line-height:35px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:25px;padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:22px;line-height:120%;text-align:left;mso-line-height-alt:26.4px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Your order:</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <!-- ====== The Whole TBody and Table Element is a line item ====== -->
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 10px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="20" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div align="center" class="alignment" style="line-height:10px">
                                                                    <div style="max-width: 125px;"><img alt="Alternate text" height="auto" src="images/Shoe.png" style="display: block; height: auto; border: 0; width: 100%;" title="Alternate text" width="125"></div>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <div class="spacer_block block-1" style="height:25px;line-height:25px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:17px;line-height:120%;text-align:left;mso-line-height-alt:20.4px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Logo Shoe Special Edition</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <div class="spacer_block block-1 mobile_hide" style="height:30px;line-height:30px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0; word-break: break-word;">$299.90</p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-7" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div align="center" class="alignment">
                                                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #E8E8E8;"><span style="word-break: break-word;"> </span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-8" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 10px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="20" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div align="center" class="alignment" style="line-height:10px">
                                                                    <div style="max-width: 125px;"><img alt="Alternate text" height="auto" src="images/T_shirt.png" style="display: block; height: auto; border: 0; width: 100%;" title="Alternate text" width="125"></div>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <div class="spacer_block block-1" style="height:25px;line-height:25px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:17px;line-height:120%;text-align:left;mso-line-height-alt:20.4px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Love Never Wanted Me T-shirt</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <div class="spacer_block block-1 mobile_hide" style="height:30px;line-height:30px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0; word-break: break-word;">$15.90</p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-9" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div align="center" class="alignment">
                                                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #E8E8E8;"><span style="word-break: break-word;"> </span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-10" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-left: 10px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="20" cellspacing="0" class="image_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div align="center" class="alignment" style="line-height:10px">
                                                                    <div style="max-width: 125px;"><img alt="Alternate text" height="auto" src="images/Summer_hat.png" style="display: block; height: auto; border: 0; width: 100%;" title="Alternate text" width="125"></div>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <div class="spacer_block block-1" style="height:25px;line-height:25px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#232323;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:17px;line-height:120%;text-align:left;mso-line-height-alt:20.4px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Summer Hat</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <div class="spacer_block block-1 mobile_hide" style="height:30px;line-height:30px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:10px;padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:120%;text-align:left;mso-line-height-alt:16.8px;">
                                                                    <p style="margin: 0; word-break: break-word;">$85.90</p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-11" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#848484;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Sub-total</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <div class="spacer_block block-1 mobile_hide" style="height:25px;line-height:25px;font-size:1px;"> </div>
                                                    </td>
                                                    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:35px;padding-right:25px;padding-top:10px;">
                                                                <div style="color:#666666;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">$401.70</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-12" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#848484;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Sales tax (VAT)</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <div class="spacer_block block-1 mobile_hide" style="height:25px;line-height:25px;font-size:1px;"> </div>
                                                    </td>
                                                    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:35px;padding-right:25px;padding-top:10px;">
                                                                <div style="color:#666666;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">0.00</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-13" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <table border="0" cellpadding="10" cellspacing="0" class="divider_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div align="center" class="alignment">
                                                                    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                                        <tbody>
                                                                            <tr>
                                                                            <td class="divider_inner" style="font-size: 1px; line-height: 1px; border-top: 1px solid #E8E8E8;"><span style="word-break: break-word;"> </span></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-14" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:35px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#848484;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">Total</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                    <td class="column column-2" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="50%">
                                                    <div class="spacer_block block-1 mobile_hide" style="height:25px;line-height:25px;font-size:1px;"> </div>
                                                    </td>
                                                    <td class="column column-3" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="25%">
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-left:35px;padding-right:25px;padding-top:10px;">
                                                                <div style="color:#666666;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:left;mso-line-height-alt:21px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word;">$401.70</span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-15" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <div class="spacer_block block-1" style="height:25px;line-height:25px;font-size:1px;"> </div>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <!-- ==========This is after the last Line Item and the start of the email footer
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-16 email-footer" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <table border="0" cellpadding="10" cellspacing="0" class="heading_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <h1 style="margin: 0; color: #1e0e4b; direction: ltr; font-family: Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif; font-size: 31px; font-weight: 700; letter-spacing: normal; line-height: 120%; text-align: center; margin-top: 0; margin-bottom: 0; mso-line-height-alt: 37.199999999999996px;"><span class="tinyMce-placeholder" style="word-break: break-word;">Appless Wishlist</span></h1>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="10" cellspacing="0" class="button_block block-2" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div align="center" class="alignment">
                                                                    <!--[if mso]>
                                                                    <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" style="height:42px;width:340px;v-text-anchor:middle;" arcsize="10%" stroke="false" fillcolor="#5563c1">
                                                                        <w:anchorlock/>
                                                                        <v:textbox inset="0px,0px,0px,0px">
                                                                            <center dir="false" style="color:#ffffff;font-family:Tahoma, sans-serif;font-size:16px">
                                                                            <![endif]-->
                                                                            <div style="background-color:#5563c1;border-bottom:0px solid transparent;border-left:0px solid transparent;border-radius:4px;border-right:0px solid transparent;border-top:0px solid transparent;color:#ffffff;display:block;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:16px;font-weight:400;mso-border-alt:none;padding-bottom:5px;padding-top:5px;text-align:center;text-decoration:none;width:50%;word-break:keep-all;"><span style="word-break: break-word; padding-left: 20px; padding-right: 20px; font-size: 16px; display: inline-block; letter-spacing: normal;"><span style="word-break: break-word; line-height: 32px;">Complete your purchase</span></span></div>
                                                                            <!--[if mso]>
                                                                            </center>
                                                                        </v:textbox>
                                                                    </v:roundrect>
                                                                    <![endif]-->
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <div class="spacer_block block-3" style="height:55px;line-height:55px;font-size:1px;"> </div>
                                                    <div class="spacer_block block-4" style="height:25px;line-height:25px;font-size:1px;"> </div>
                                                    <table border="0" cellpadding="10" cellspacing="0" class="social_block block-5" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div align="center" class="alignment">
                                                                    <table border="0" cellpadding="0" cellspacing="0" class="social-table" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block;" width="168px">
                                                                        <tbody>
                                                                            <tr>
                                                                            <td style="padding:0 5px 0 5px;"><a href="https://www.facebook.com" target="_blank"><img alt="Facebook" height="auto" src="images/facebook2x.png" style="display: block; height: auto; border: 0;" title="Facebook" width="32"></a></td>
                                                                            <td style="padding:0 5px 0 5px;"><a href="https://www.twitter.com" target="_blank"><img alt="Twitter" height="auto" src="images/twitter2x.png" style="display: block; height: auto; border: 0;" title="Twitter" width="32"></a></td>
                                                                            <td style="padding:0 5px 0 5px;"><a href="https://www.instagram.com" target="_blank"><img alt="Instagram" height="auto" src="images/instagram2x.png" style="display: block; height: auto; border: 0;" title="Instagram" width="32"></a></td>
                                                                            <td style="padding:0 5px 0 5px;"><a href="https://www.linkedin.com" target="_blank"><img alt="LinkedIn" height="auto" src="images/linkedin2x.png" style="display: block; height: auto; border: 0;" title="LinkedIn" width="32"></a></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    <table border="0" cellpadding="0" cellspacing="0" class="paragraph_block block-6" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="padding-bottom:5px;padding-left:10px;padding-right:10px;padding-top:10px;">
                                                                <div style="color:#555555;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:14px;line-height:150%;text-align:center;mso-line-height-alt:21px;">
                                                                    <p style="margin: 0; word-break: break-word;">©Meisy Ltd. All Rights Reserved</p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-17" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <table border="0" cellpadding="10" cellspacing="0" class="paragraph_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; word-break: break-word;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad">
                                                                <div style="color:#ffffff;font-family:Montserrat, Trebuchet MS, Lucida Grande, Lucida Sans Unicode, Lucida Sans, Tahoma, sans-serif;font-size:12px;line-height:120%;text-align:center;mso-line-height-alt:14.399999999999999px;">
                                                                    <p style="margin: 0; word-break: break-word;"><span style="word-break: break-word; color: #555555;"><a href="#" rel="noopener" style="text-decoration: none; color: #848484;" target="_blank">Terms &amp; Conditions</a> <strong>|</strong> <a href="#" rel="noopener" style="text-decoration: none; color: #848484;" target="_blank">Unsubscribe</a></span></p>
                                                                </div>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <table align="center" border="0" cellpadding="0" cellspacing="0" class="row row-18" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff;" width="100%">
                                <tbody>
                                    <tr>
                                        <td>
                                        <table align="center" border="0" cellpadding="0" cellspacing="0" class="row-content stack" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #ffffff; color: #000000; width: 700px; margin: 0 auto;" width="700">
                                            <tbody>
                                                <tr>
                                                    <td class="column column-1" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-weight: 400; text-align: left; padding-bottom: 5px; padding-top: 5px; vertical-align: top; border-top: 0px; border-right: 0px; border-bottom: 0px; border-left: 0px;" width="100%">
                                                    <table border="0" cellpadding="0" cellspacing="0" class="icons_block block-1" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; text-align: center; line-height: 0;" width="100%">
                                                        <tbody>
                                                            <tr>
                                                                <td class="pad" style="vertical-align: middle; color: #1e0e4b; font-family: 'Inter', sans-serif; font-size: 15px; padding-bottom: 5px; padding-top: 5px; text-align: center;">
                                                                <!--[if vml]>
                                                                <table align="center" cellpadding="0" cellspacing="0" role="presentation" style="display:inline-block;padding-left:0px;padding-right:0px;mso-table-lspace: 0pt;mso-table-rspace: 0pt;">
                                                                    <![endif]-->
                                                                    <!--[if !vml]><!-->
                                                                    <table cellpadding="0" cellspacing="0" class="icons-inner" role="presentation" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; display: inline-block; padding-left: 0px; padding-right: 0px;">
                                                                        <!--<![endif]-->
                                                                        <tbody>
                                                                            <tr>
                                                                            <td style="vertical-align: middle; text-align: center; padding-top: 5px; padding-bottom: 5px; padding-left: 5px; padding-right: 6px;"><a href="http://designedwithbeefree.com/" style="text-decoration: none;" target="_blank"><img align="center" alt="Beefree Logo" class="icon" height="auto" src="images/Beefree-logo.png" style="display: block; height: auto; margin: 0 auto; border: 0;" width="34"></a></td>
                                                                            <td style="font-family: 'Inter', sans-serif; font-size: 15px; font-weight: undefined; color: #1e0e4b; vertical-align: middle; letter-spacing: undefined; text-align: center; line-height: normal;"><a href="http://designedwithbeefree.com/" style="color: #1e0e4b; text-decoration: none;" target="_blank">Designed with Beefree</a></td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                    </td>
                                                                    </tr>
                                                                    </tbody>
                                                                </table>
                                                                </td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                            <!-- End -->
                </body>
                </html>
                `)
            .setText("This is the text content");

        // console.log("Mailer Send EmailParams", emailParams)
        // console.log("Mailer Send Recipients", recipients)

        await mailerSend.email.send(emailParams);
    }
}

