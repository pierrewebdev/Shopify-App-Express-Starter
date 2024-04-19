-- --------------------------------------------------------
-- Host:                         127.0.0.1
-- Server version:               5.7.33 - MySQL Community Server (GPL)
-- Server OS:                    Win64
-- HeidiSQL Version:             11.2.0.6213
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;


-- Dumping database structure for returnsage
CREATE DATABASE IF NOT EXISTS `returnsage` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `returnsage`;

-- Dumping structure for table returnsage.orders
CREATE TABLE IF NOT EXISTS `orders` (
  `table_id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) DEFAULT NULL,
  `id` int(11) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `cart_token` varchar(255) DEFAULT NULL,
  `checkout_id` varchar(255) DEFAULT NULL,
  `checkout_token` varchar(255) DEFAULT NULL,
  `order_created_at` datetime DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `financial_status` varchar(255) DEFAULT NULL,
  `fulfillment_status` varchar(255) DEFAULT NULL,
  `note` varchar(255) DEFAULT NULL,
  `order_number` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `subtotal_price` varchar(255) DEFAULT NULL,
  `total_price` varchar(255) DEFAULT NULL,
  `total_tax` varchar(255) DEFAULT NULL,
  `customer` longtext,
  `line_items` longtext,
  `shipping_address` longtext,
  `number` varchar(255) DEFAULT NULL,
  `tags` varchar(255) DEFAULT NULL,
  `created_at_date` datetime DEFAULT NULL,
  `updated_at_date` datetime DEFAULT NULL,
  PRIMARY KEY (`table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table returnsage.orders: ~0 rows (approximately)
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;

-- Dumping structure for table returnsage.products
CREATE TABLE IF NOT EXISTS `products` (
  `table_id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) DEFAULT NULL,
  `id` int(11) DEFAULT NULL,
  `title` mediumtext,
  `body_html` longtext,
  `vendor` mediumtext,
  `product_type` varchar(255) DEFAULT NULL,
  `published_at` varchar(255) DEFAULT NULL,
  `template_suffix` varchar(255) DEFAULT NULL,
  `published_scope` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `admin_graphql_api_id` varchar(255) DEFAULT NULL,
  `image` varchar(255) DEFAULT NULL,
  `created_at` varchar(255) DEFAULT NULL,
  `updated_at` varchar(255) DEFAULT NULL,
  `deleted_at` varchar(255) DEFAULT NULL,
  `created_at_date` datetime DEFAULT NULL,
  `updated_at_date` datetime DEFAULT NULL,
  PRIMARY KEY (`table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table returnsage.products: ~0 rows (approximately)
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
/*!40000 ALTER TABLE `products` ENABLE KEYS */;

-- Dumping structure for table returnsage.product_collections
CREATE TABLE IF NOT EXISTS `product_collections` (
  `table_id` int(11) NOT NULL AUTO_INCREMENT,
  `id` int(11) DEFAULT NULL,
  `store_id` int(11) DEFAULT NULL,
  `collection_type` varchar(255) DEFAULT NULL,
  `handle` mediumtext,
  `title` mediumtext,
  `sort_order` mediumtext,
  `admin_graphql_api_id` mediumtext,
  `image` mediumtext,
  `created_at_date` datetime DEFAULT NULL,
  `updated_at_date` datetime DEFAULT NULL,
  PRIMARY KEY (`table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table returnsage.product_collections: ~0 rows (approximately)
/*!40000 ALTER TABLE `product_collections` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_collections` ENABLE KEYS */;

-- Dumping structure for table returnsage.shopify_stores
CREATE TABLE IF NOT EXISTS `shopify_stores` (
  `table_id` int(11) NOT NULL AUTO_INCREMENT,
  `id` bigint(20) DEFAULT NULL,
  `myshopify_domain` varchar(255) NOT NULL,
  `accessToken` varchar(255) DEFAULT NULL,
  `name` varchar(255) DEFAULT NULL,
  `plan_name` varchar(255) DEFAULT NULL,
  `currency` varchar(255) DEFAULT NULL,
  `shop_owner` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `customer_email` varchar(255) DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `eligible_for_card_reader_giveaway` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`table_id`),
  UNIQUE KEY `myshopify_domain` (`myshopify_domain`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Dumping data for table returnsage.shopify_stores: ~0 rows (approximately)
/*!40000 ALTER TABLE `shopify_stores` DISABLE KEYS */;
INSERT INTO `shopify_stores` (`table_id`, `id`, `myshopify_domain`, `accessToken`, `name`, `plan_name`, `currency`, `shop_owner`, `email`, `customer_email`, `phone`, `eligible_for_card_reader_giveaway`, `created_at`, `updated_at`) VALUES
	(1, 79250817297, 'sid-checkout-extensions.myshopify.com', 'shpua_d0a833a079377d1a5774d669cb66b207', 'Sid-Checkout-Extensions', NULL, 'INR', NULL, 'sid.sjv@gmail.com', NULL, NULL, NULL, '2024-04-09 04:40:05', '2024-04-09 04:40:05');
/*!40000 ALTER TABLE `shopify_stores` ENABLE KEYS */;

-- Dumping structure for table returnsage.store_locations
CREATE TABLE IF NOT EXISTS `store_locations` (
  `table_id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) DEFAULT NULL,
  `id` int(11) DEFAULT NULL,
  `name` mediumtext,
  `legacy` tinyint(1) DEFAULT NULL,
  `active` tinyint(1) DEFAULT NULL,
  `address1` mediumtext,
  `address2` mediumtext,
  `zip` varchar(255) DEFAULT NULL,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `province` varchar(255) DEFAULT NULL,
  `created_at` varchar(255) DEFAULT NULL,
  `updated_at` varchar(255) DEFAULT NULL,
  `country_code` varchar(255) DEFAULT NULL,
  `country_name` varchar(255) DEFAULT NULL,
  `province_code` varchar(255) DEFAULT NULL,
  `localized_country_name` varchar(255) DEFAULT NULL,
  `localized_province_name` varchar(255) DEFAULT NULL,
  `admin_graphql_api_id` varchar(255) DEFAULT NULL,
  `deleted_at` varchar(255) DEFAULT NULL,
  `created_at_date` datetime DEFAULT NULL,
  `updated_at_date` datetime DEFAULT NULL,
  PRIMARY KEY (`table_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- Dumping data for table returnsage.store_locations: ~0 rows (approximately)
/*!40000 ALTER TABLE `store_locations` DISABLE KEYS */;
/*!40000 ALTER TABLE `store_locations` ENABLE KEYS */;

-- Dumping structure for table returnsage.users
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `email_verified_at` datetime DEFAULT NULL,
  `remember_token` varchar(255) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `authtoken` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Dumping data for table returnsage.users: ~0 rows (approximately)
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` (`id`, `name`, `email`, `password`, `email_verified_at`, `remember_token`, `created_at`, `updated_at`, `authtoken`) VALUES
	(1, 'Sid-Checkout-Extensions', 'sid.sjv@gmail.com', '$2a$08$C0I5URV0WxuYwUVQ.tAASORIApKRE30j/GELdBJgW8z0iWZzVohBm', NULL, NULL, '2024-04-09 04:40:05', '2024-04-09 04:40:05', NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;

-- Dumping structure for table returnsage.user_stores
CREATE TABLE IF NOT EXISTS `user_stores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=latin1;

-- Dumping data for table returnsage.user_stores: ~0 rows (approximately)
/*!40000 ALTER TABLE `user_stores` DISABLE KEYS */;
INSERT INTO `user_stores` (`id`, `store_id`, `user_id`, `created_at`, `updated_at`) VALUES
	(1, 1, 1, '2024-04-09 04:40:05', '2024-04-09 04:40:05');
/*!40000 ALTER TABLE `user_stores` ENABLE KEYS */;

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
