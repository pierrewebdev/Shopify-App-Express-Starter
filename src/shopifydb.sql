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


-- Dumping database structure for shopifydb
CREATE DATABASE IF NOT EXISTS `shopifydb` /*!40100 DEFAULT CHARACTER SET latin1 */;
USE `shopifydb`;

-- Dumping structure for table shopifydb.orders
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

-- Dumping data for table shopifydb.product_collections: ~0 rows (approximately)
/*!40000 ALTER TABLE `product_collections` DISABLE KEYS */;
/*!40000 ALTER TABLE `product_collections` ENABLE KEYS */;

-- Dumping structure for table shopifydb.shopify_stores
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
)


-- Dumping structure for table shopifydb.users
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
);

-- Dumping structure for table shopifydb.user_stores
CREATE TABLE IF NOT EXISTS `user_stores` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `store_id` int(11) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
);

