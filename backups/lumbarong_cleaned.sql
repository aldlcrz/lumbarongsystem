CREATE DATABASE IF NOT EXISTS `lumbarong`;
USE `lumbarong`;
SET FOREIGN_KEY_CHECKS=0;

-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: lumbarong
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `addresses`
--

DROP TABLE IF EXISTS `addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `addresses` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `UserId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `fullName` varchar(255) NOT NULL,
  `phoneNumber` varchar(255) NOT NULL,
  `street` varchar(255) NOT NULL,
  `barangay` varchar(255) NOT NULL,
  `city` varchar(255) NOT NULL,
  `province` varchar(255) NOT NULL,
  `postalCode` varchar(255) NOT NULL,
  `label` varchar(255) DEFAULT 'Home',
  `isDefault` tinyint(1) DEFAULT 0,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `UserId` (`UserId`),
  CONSTRAINT addresses_UserId_fk FOREIGN KEY (UserId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `addresses`
--

LOCK TABLES `addresses` WRITE;
/*!40000 ALTER TABLE `addresses` DISABLE KEYS */;
INSERT INTO `addresses` VALUES ('7e66b91c-03a3-4d75-8a14-3726b17eaa82','b1be8dfe-dd12-4262-b313-602b665f57d8','Ailo','00224255457','bdgxfdh','getgfee','gettte','eyetet45y','2005','Home',0,'2026-02-27 16:48:56','2026-03-07 15:57:50'),('7ece9066-b727-4680-adc4-2867ff3e3f72','ac8faf27-99a0-4a9e-a1e0-05b8832776df','mk','0123456789','hjvhgvvhgvhg','mbvhgg','jhvkhvghg','hvhgvvhgh','jvhgh','Home',1,'2026-03-02 09:10:23','2026-03-02 09:10:23');
/*!40000 ALTER TABLE `addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`),
  UNIQUE KEY `name_2` (`name`),
  UNIQUE KEY `name_3` (`name`),
  UNIQUE KEY `name_4` (`name`),
  UNIQUE KEY `name_5` (`name`),
  UNIQUE KEY `name_6` (`name`),
  UNIQUE KEY `name_7` (`name`),
  UNIQUE KEY `name_8` (`name`),
  UNIQUE KEY `name_9` (`name`),
  UNIQUE KEY `name_10` (`name`),
  UNIQUE KEY `name_11` (`name`),
  UNIQUE KEY `name_12` (`name`),
  UNIQUE KEY `name_13` (`name`),
  UNIQUE KEY `name_14` (`name`),
  UNIQUE KEY `name_15` (`name`),
  UNIQUE KEY `name_16` (`name`),
  UNIQUE KEY `name_17` (`name`),
  UNIQUE KEY `name_18` (`name`),
  UNIQUE KEY `name_19` (`name`),
  UNIQUE KEY `name_20` (`name`),
  UNIQUE KEY `name_21` (`name`),
  UNIQUE KEY `name_22` (`name`),
  UNIQUE KEY `name_23` (`name`),
  UNIQUE KEY `name_24` (`name`),
  UNIQUE KEY `name_25` (`name`),
  UNIQUE KEY `name_26` (`name`),
  UNIQUE KEY `name_27` (`name`),
  UNIQUE KEY `name_28` (`name`),
  UNIQUE KEY `name_29` (`name`),
  UNIQUE KEY `name_30` (`name`),
  UNIQUE KEY `name_31` (`name`),
  UNIQUE KEY `name_32` (`name`),
  UNIQUE KEY `name_33` (`name`),
  UNIQUE KEY `name_34` (`name`),
  UNIQUE KEY `name_35` (`name`),
  UNIQUE KEY `name_36` (`name`),
  UNIQUE KEY `name_37` (`name`),
  UNIQUE KEY `name_38` (`name`),
  UNIQUE KEY `name_39` (`name`),
  UNIQUE KEY `name_40` (`name`),
  UNIQUE KEY `name_41` (`name`),
  UNIQUE KEY `name_42` (`name`),
  UNIQUE KEY `name_43` (`name`),
  UNIQUE KEY `name_44` (`name`),
  UNIQUE KEY `name_45` (`name`),
  UNIQUE KEY `name_46` (`name`),
  UNIQUE KEY `name_47` (`name`),
  UNIQUE KEY `name_48` (`name`),
  UNIQUE KEY `name_49` (`name`),
  UNIQUE KEY `name_50` (`name`),
  UNIQUE KEY `name_51` (`name`),
  UNIQUE KEY `name_52` (`name`),
  UNIQUE KEY `name_53` (`name`),
  UNIQUE KEY `name_54` (`name`),
  UNIQUE KEY `name_55` (`name`),
  UNIQUE KEY `name_56` (`name`),
  UNIQUE KEY `name_57` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES ('013e7c59-ead9-45b9-b7ae-469024edf380','Shirt-jack Barong','Semi-formal attire','2026-03-01 16:40:26','2026-03-01 16:40:26'),('3a1b7f2a-c250-4544-94d9-80019060cba2','barong ng bakla','ayaw kol','2026-03-01 17:15:15','2026-03-01 17:15:46'),('3dd532f0-b343-406f-9801-59076f406b57','Organza Barong','Usually made of silk or polyester','2026-03-01 16:46:33','2026-03-01 16:46:33'),('44222c1a-3227-44f8-bbce-e43cb34901c8','Formal barong','Traditional Filipino formal wear for men.','2026-02-26 16:04:43','2026-03-01 16:37:40'),('b482e364-99ed-4ffc-8ba6-0c6b88ffdeca','Filipiniana Dresses','Elegant traditional dresses for women.','2026-02-26 16:04:43','2026-02-26 16:04:43'),('b55e8fc3-b095-4999-95b2-cc0676bb7f7a','polo barong','Smart Casual','2026-03-01 16:38:58','2026-03-01 16:38:58'),('c0297625-9015-4f86-9be7-1f20f715ed89','Barong Tagalog','Traditional Filipino formal wear for men.','2026-03-01 17:52:58','2026-03-01 17:52:58'),('c301ce8e-b7ca-43e8-9f67-cf823d529808','Jusi Barong','Made of silk or banana fiber','2026-03-01 16:45:38','2026-03-01 16:45:38'),('c3a6a27c-356c-4ee6-bff2-769c7dbbb263','Pi├▒a Barong','Made from pineapple fiber','2026-03-01 16:42:46','2026-03-01 16:42:46'),('f03f8813-3bc5-431b-a137-88ee937db72a','Barong bisaya','Bai na Bai','2026-03-01 17:00:12','2026-03-01 17:00:12');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `content` text NOT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `senderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `receiverId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_sender_id_receiver_id` (`senderId`,`receiverId`),
  KEY `messages_receiver_id_sender_id` (`receiverId`,`senderId`),
  CONSTRAINT messages_senderId_fk FOREIGN KEY (senderId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT messages_receiverId_fk FOREIGN KEY (receiverId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (1,'hi',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 09:46:19','2026-03-01 09:46:41'),(2,'hello',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-05 01:40:08','2026-03-05 02:23:00'),(3,'hi',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-07 16:36:50','2026-03-07 16:42:51');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `message` text NOT NULL,
  `type` enum('order','review','system') DEFAULT NULL,
  `isRead` tinyint(1) DEFAULT 0,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `notifications_user_id` (`userId`),
  CONSTRAINT notifications_userId_fk FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=77 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,'New order received for Modern Filipiniana Gown','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-02-26 14:28:46','2026-03-05 02:26:01'),(2,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:28:46','2026-03-04 13:17:58'),(3,'Your order status has been updated to: Processing','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:36:00','2026-03-04 13:17:58'),(4,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:36:05','2026-03-04 13:17:58'),(5,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:42:20','2026-03-04 13:17:58'),(6,'Your GCash payment has been verified.','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:42:37','2026-03-04 13:17:58'),(7,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:43:14','2026-03-04 13:17:58'),(8,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:43:16','2026-03-04 13:17:58'),(9,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:43:19','2026-03-04 13:17:58'),(10,'An order has been rated and completed!','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-02-26 14:43:51','2026-03-05 02:26:01'),(11,'New order received for Classic Pi├▒a Barong','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 09:45:32','2026-03-05 02:26:01'),(12,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 09:45:32','2026-03-04 13:17:58'),(13,'New order received for Filipiniana','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:31:58','2026-03-05 02:26:01'),(14,'New order received for Pina','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:31:58','2026-03-05 02:26:01'),(15,'New order received for Formal Barong','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:31:58','2026-03-05 02:26:01'),(16,'New order received for Polo Barong','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:31:58','2026-03-05 02:26:01'),(17,'New order received for Shirt Jack','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:31:58','2026-03-05 02:26:01'),(18,'New order received for Bisayang barong','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:31:58','2026-03-05 02:26:01'),(19,'New order received for Organza','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:31:58','2026-03-05 02:26:01'),(20,'New order received for Jusi','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:31:58','2026-03-05 02:26:01'),(21,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:31:58','2026-03-04 13:17:58'),(22,'New order received for Filipiniana','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:42:04','2026-03-05 02:26:01'),(23,'New order received for Pina','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:42:04','2026-03-05 02:26:01'),(24,'New order received for Formal Barong','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:42:04','2026-03-05 02:26:01'),(25,'New order received for Polo Barong','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:42:04','2026-03-05 02:26:01'),(26,'New order received for Shirt Jack','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:42:04','2026-03-05 02:26:01'),(27,'New order received for Bisayang barong','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:42:04','2026-03-05 02:26:01'),(28,'New order received for Organza','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:42:04','2026-03-05 02:26:01'),(29,'New order received for Jusi','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-01 17:42:04','2026-03-05 02:26:01'),(30,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:42:04','2026-03-04 13:17:58'),(31,'Your order status has been updated to: Processing','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:57:48','2026-03-04 13:17:58'),(32,'Your order status has been updated to: Processing','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:58:01','2026-03-04 13:17:58'),(33,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:58:31','2026-03-04 13:17:58'),(34,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:58:33','2026-03-04 13:17:58'),(35,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:58:56','2026-03-04 13:17:58'),(36,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:58:59','2026-03-04 13:17:58'),(37,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 23:25:54','2026-03-04 13:17:58'),(38,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 23:25:56','2026-03-04 13:17:58'),(39,'Your GCash payment has been verified.','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 23:26:39','2026-03-04 13:17:58'),(40,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-02 02:05:56','2026-03-04 13:17:58'),(41,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-02 02:06:03','2026-03-04 13:17:58'),(42,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-02 02:10:04','2026-03-04 13:17:58'),(43,'New order received for Filipiniana','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-02 02:18:53','2026-03-05 02:26:01'),(44,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-02 02:18:53','2026-03-04 13:17:58'),(45,'Cancellation requested for an order','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-02 02:19:31','2026-03-05 02:26:01'),(46,'Your order status has been updated to: Processing','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-02 02:51:40','2026-03-04 13:17:58'),(47,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 11:20:06','2026-03-04 13:17:58'),(48,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 11:20:11','2026-03-04 13:17:58'),(49,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 11:20:12','2026-03-04 13:17:58'),(50,'An item in your order has been rated!','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-04 13:01:27','2026-03-05 02:26:01'),(51,'New order received for bading','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-04 13:02:46','2026-03-05 02:26:01'),(52,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 13:02:46','2026-03-04 13:17:58'),(53,'Your order status has been updated to: Processing','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 13:03:02','2026-03-04 13:17:58'),(54,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 13:03:06','2026-03-04 13:17:58'),(55,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 13:03:20','2026-03-04 13:17:58'),(56,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 13:03:21','2026-03-04 13:17:58'),(57,'An item in your order has been rated!','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-04 13:03:38','2026-03-05 02:26:01'),(58,'New order received for Filipiniana','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-05 01:37:51','2026-03-05 02:26:01'),(59,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-05 01:37:51','2026-03-05 01:38:27'),(60,'New order received for Filipiniana','order',1,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-05 01:46:37','2026-03-05 02:26:01'),(61,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-05 01:46:37','2026-03-05 05:36:54'),(62,'Your order status has been updated to: Processing','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-05 01:49:20','2026-03-05 05:36:54'),(63,'Your order status has been updated to: Processing','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 13:12:47','2026-03-07 13:15:45'),(64,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 13:12:49','2026-03-07 13:15:45'),(65,'New order received for bading','order',0,'10a872be-ee27-4e11-9ff2-52e0910d2e5e','2026-03-07 16:05:56','2026-03-07 16:05:56'),(66,'Your order has been placed successfully. Mabuhay!','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:05:56','2026-03-07 16:06:39'),(67,'Your order status has been updated to: Processing','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:18','2026-03-07 16:06:39'),(68,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:20','2026-03-07 16:06:39'),(69,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:21','2026-03-07 16:06:39'),(70,'Your order status has been updated to: To Ship','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:22','2026-03-07 16:06:39'),(71,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:23','2026-03-07 16:06:39'),(72,'Your order status has been updated to: Shipped','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:25','2026-03-07 16:06:39'),(73,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:26','2026-03-07 16:06:39'),(74,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:27','2026-03-07 16:06:39'),(75,'Your order status has been updated to: Delivered','order',1,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:06:27','2026-03-07 16:06:39'),(76,'New artisan registration: bads','system',0,'6baf8440-2a34-41a9-a9db-563563efcbd0','2026-03-08 09:31:45','2026-03-08 09:31:45');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderitems`
--

DROP TABLE IF EXISTS `orderitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orderitems` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `quantity` int(11) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `productId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `isRated` tinyint(1) DEFAULT 0,
  `color` varchar(255) DEFAULT NULL,
  `design` varchar(255) DEFAULT NULL,
  `size` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `orderId` (`orderId`),
  KEY `productId` (`productId`),
  CONSTRAINT orderitems_orderId_fk FOREIGN KEY (orderId) REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT orderitems_productId_fk FOREIGN KEY (productId) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitems`
--

LOCK TABLES `orderitems` WRITE;
/*!40000 ALTER TABLE `orderitems` DISABLE KEYS */;
INSERT INTO `orderitems` VALUES (3,1,500.00,'1bcb8e5f-eb7b-429d-b98f-ad857c8f038f','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-01 17:31:58','2026-03-01 17:31:58',0,NULL,NULL,NULL),(4,1,500.00,'1bcb8e5f-eb7b-429d-b98f-ad857c8f038f','323b5fda-0a68-464d-b2f7-2c7d83f67722','2026-03-01 17:31:58','2026-03-01 17:31:58',0,NULL,NULL,NULL),(5,1,500.00,'1bcb8e5f-eb7b-429d-b98f-ad857c8f038f','4865d9e9-168c-49d3-af71-8f7c6ac3b137','2026-03-01 17:31:58','2026-03-01 17:31:58',0,NULL,NULL,NULL),(6,1,500.00,'1bcb8e5f-eb7b-429d-b98f-ad857c8f038f','71541820-8ee0-4386-858b-00fb6107f279','2026-03-01 17:31:58','2026-03-01 17:31:58',0,NULL,NULL,NULL),(7,1,500.00,'1bcb8e5f-eb7b-429d-b98f-ad857c8f038f','82a95d10-49a6-48df-a5a8-6619a67bf3cc','2026-03-01 17:31:58','2026-03-01 17:31:58',0,NULL,NULL,NULL),(8,1,8000.00,'1bcb8e5f-eb7b-429d-b98f-ad857c8f038f','e3157836-e337-41ff-be84-c864ea370673','2026-03-01 17:31:58','2026-03-01 17:31:58',0,NULL,NULL,NULL),(9,1,500.00,'1bcb8e5f-eb7b-429d-b98f-ad857c8f038f','b15112fe-6d3a-4859-92af-6fff80b92ef9','2026-03-01 17:31:58','2026-03-01 17:31:58',0,NULL,NULL,NULL),(10,1,500.00,'1bcb8e5f-eb7b-429d-b98f-ad857c8f038f','83716e60-fce5-4a42-81ff-4ad91e3fdcae','2026-03-01 17:31:58','2026-03-01 17:31:58',0,NULL,NULL,NULL),(11,1,500.00,'ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-01 17:42:04','2026-03-01 17:42:04',0,NULL,NULL,NULL),(12,1,500.00,'ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0','323b5fda-0a68-464d-b2f7-2c7d83f67722','2026-03-01 17:42:04','2026-03-01 17:42:04',0,NULL,NULL,NULL),(13,1,500.00,'ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0','4865d9e9-168c-49d3-af71-8f7c6ac3b137','2026-03-01 17:42:04','2026-03-01 17:42:04',0,NULL,NULL,NULL),(14,1,500.00,'ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0','71541820-8ee0-4386-858b-00fb6107f279','2026-03-01 17:42:04','2026-03-01 17:42:04',0,NULL,NULL,NULL),(15,1,500.00,'ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0','82a95d10-49a6-48df-a5a8-6619a67bf3cc','2026-03-01 17:42:04','2026-03-01 17:42:04',0,NULL,NULL,NULL),(16,1,8000.00,'ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0','e3157836-e337-41ff-be84-c864ea370673','2026-03-01 17:42:04','2026-03-01 17:42:04',0,NULL,NULL,NULL),(17,1,500.00,'ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0','b15112fe-6d3a-4859-92af-6fff80b92ef9','2026-03-01 17:42:04','2026-03-01 17:42:04',0,NULL,NULL,NULL),(18,1,500.00,'ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0','83716e60-fce5-4a42-81ff-4ad91e3fdcae','2026-03-01 17:42:04','2026-03-01 17:42:04',0,NULL,NULL,NULL),(19,1,500.00,'4dc92aac-bfaf-47b6-8169-9e91e2df38b5','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-02 02:18:53','2026-03-04 13:01:27',1,NULL,NULL,NULL),(20,1,499.00,'9fe0a8fd-446a-4f33-b58b-77ca9fb57edf','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-04 13:02:46','2026-03-04 13:03:38',1,NULL,NULL,NULL),(21,1,500.00,'babdb442-085c-4ea7-b0fa-ca32966458a0','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-05 01:37:51','2026-03-05 01:37:51',0,'[','[',''),(22,16,500.00,'33716f46-aff7-4e41-bb44-17746f7d1a7a','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-05 01:46:36','2026-03-05 01:46:36',0,'[','[',''),(23,1,499.00,'93270658-79f1-4f88-82d3-f131f13d041c','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-07 16:05:56','2026-03-07 16:05:56',0,'blue','normal','m');
/*!40000 ALTER TABLE `orderitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `totalAmount` decimal(10,2) NOT NULL,
  `paymentMethod` enum('GCash','COD') NOT NULL,
  `status` enum('Pending','Processing','To Ship','Shipped','To Be Delivered','Delivered','Completed','Cancellation Requested','Cancelled','Return Requested') DEFAULT 'Pending',
  `shippingAddress` text NOT NULL,
  `referenceNumber` varchar(255) DEFAULT NULL,
  `receiptImage` varchar(255) DEFAULT NULL,
  `isPaymentVerified` tinyint(1) DEFAULT 0,
  `paymentVerifiedAt` datetime DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `reviewComment` text DEFAULT NULL,
  `reviewImages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`reviewImages`)),
  `reviewCreatedAt` datetime DEFAULT NULL,
  `customerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orders_customer_id` (`customerId`),
  KEY `orders_status` (`status`),
  KEY `orders_created_at` (`createdAt`),
  CONSTRAINT orders_customerId_fk FOREIGN KEY (customerId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES ('1bcb8e5f-eb7b-429d-b98f-ad857c8f038f',11500.00,'GCash','Delivered','Ailo | bdgxfdh, getgfee, gettte, eyetet45y 2005 | Contact: 00224255457','','http://localhost:5000/uploads/1772386315644-download.jfif',1,'2026-03-01 23:26:39',NULL,NULL,NULL,NULL,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:31:58','2026-03-02 02:10:04'),('225091dc-87ca-4e4f-8091-da8c605f8263',12000.00,'GCash','Completed','twtwewt | Contact: 42251212','','http://localhost:5000/uploads/1772116123341-download.jfif',1,'2026-02-26 14:42:37',5,'','[]','2026-02-26 14:43:51','b1be8dfe-dd12-4262-b313-602b665f57d8','2026-02-26 14:28:44','2026-02-26 14:43:51'),('33716f46-aff7-4e41-bb44-17746f7d1a7a',8000.00,'COD','Delivered','Ailo | bdgxfdh, getgfee, gettte, eyetet45y 2005 | Contact: 00224255457',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-05 01:46:36','2026-03-07 16:06:27'),('4dc92aac-bfaf-47b6-8169-9e91e2df38b5',500.00,'COD','Completed','Ailo | bdgxfdh, getgfee, gettte, eyetet45y 2005 | Contact: 00224255457',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-02 02:18:53','2026-03-04 13:01:27'),('714523af-931d-414c-aa1f-3c7638036e64',8500.00,'COD','Cancellation Requested','Ailo | bdgxfdh, getgfee, gettte, eyetet45y 2005 | Contact: 00224255457',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 09:45:31','2026-03-01 17:55:08'),('93270658-79f1-4f88-82d3-f131f13d041c',499.00,'GCash','Delivered','Ailo | bdgxfdh, getgfee, gettte, eyetet45y 2005 | Contact: 00224255457','',NULL,0,NULL,NULL,NULL,NULL,NULL,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-07 16:05:55','2026-03-07 16:06:27'),('9fe0a8fd-446a-4f33-b58b-77ca9fb57edf',499.00,'COD','Completed','Ailo | bdgxfdh, getgfee, gettte, eyetet45y 2005 | Contact: 00224255457',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-04 13:02:46','2026-03-04 13:03:38'),('babdb442-085c-4ea7-b0fa-ca32966458a0',500.00,'COD','Delivered','Ailo | bdgxfdh, getgfee, gettte, eyetet45y 2005 | Contact: 00224255457',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-05 01:37:51','2026-03-07 16:06:26'),('ea72b832-fdd6-49e3-b0bd-fc06b9ef3fb0',11500.00,'COD','Delivered','Ailo | bdgxfdh, getgfee, gettte, eyetet45y 2005 | Contact: 00224255457',NULL,NULL,0,NULL,NULL,NULL,NULL,NULL,'b1be8dfe-dd12-4262-b313-602b665f57d8','2026-03-01 17:42:04','2026-03-01 23:25:56');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productcolors`
--

DROP TABLE IF EXISTS `productcolors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productcolors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `color` varchar(255) NOT NULL,
  `ProductId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ProductId` (`ProductId`),
  CONSTRAINT productcolors_ProductId_fk FOREIGN KEY (ProductId) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productcolors`
--

LOCK TABLES `productcolors` WRITE;
/*!40000 ALTER TABLE `productcolors` DISABLE KEYS */;
/*!40000 ALTER TABLE `productcolors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productimages`
--

DROP TABLE IF EXISTS `productimages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productimages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `url` varchar(255) NOT NULL,
  `ProductId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `designName` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ProductId` (`ProductId`),
  CONSTRAINT productimages_ProductId_fk FOREIGN KEY (ProductId) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productimages`
--

LOCK TABLES `productimages` WRITE;
/*!40000 ALTER TABLE `productimages` DISABLE KEYS */;
INSERT INTO `productimages` VALUES (10,'http://localhost:5000/uploads/1772117516586-631155092_1429175821981462_5348918437921154888_n.png','b7aea374-45e9-4361-afd7-9928474bf0b0','2026-02-26 14:52:32','2026-02-26 14:52:32',NULL),(11,'http://localhost:5000/uploads/1772117522525-632948159_1295120532638949_427555239407517607_n.png','b7aea374-45e9-4361-afd7-9928474bf0b0','2026-02-26 14:52:32','2026-02-26 14:52:32',NULL),(12,'http://localhost:5000/uploads/1772117546400-631867575_1584874299507173_8870221466873342014_n.png','b7aea374-45e9-4361-afd7-9928474bf0b0','2026-02-26 14:52:32','2026-02-26 14:52:32',NULL),(16,'http://localhost:5000/uploads/1772383809622-download (6).jfif','4865d9e9-168c-49d3-af71-8f7c6ac3b137','2026-03-01 16:50:44','2026-03-01 16:50:44',NULL),(17,'http://localhost:5000/uploads/1772383814670-download (5).jfif','4865d9e9-168c-49d3-af71-8f7c6ac3b137','2026-03-01 16:50:44','2026-03-01 16:50:44',NULL),(18,'http://localhost:5000/uploads/1772383819086-download (4).jfif','4865d9e9-168c-49d3-af71-8f7c6ac3b137','2026-03-01 16:50:44','2026-03-01 16:50:44',NULL),(19,'http://localhost:5000/uploads/1772383892743-download (9).jfif','83716e60-fce5-4a42-81ff-4ad91e3fdcae','2026-03-01 16:51:54','2026-03-01 16:51:54',NULL),(20,'http://localhost:5000/uploads/1772383896884-download (8).jfif','83716e60-fce5-4a42-81ff-4ad91e3fdcae','2026-03-01 16:51:54','2026-03-01 16:51:54',NULL),(21,'http://localhost:5000/uploads/1772383901114-download (7).jfif','83716e60-fce5-4a42-81ff-4ad91e3fdcae','2026-03-01 16:51:54','2026-03-01 16:51:54',NULL),(22,'http://localhost:5000/uploads/1772383961003-download (12).jfif','b15112fe-6d3a-4859-92af-6fff80b92ef9','2026-03-01 16:53:13','2026-03-01 16:53:13',NULL),(23,'http://localhost:5000/uploads/1772383965155-download (11).jfif','b15112fe-6d3a-4859-92af-6fff80b92ef9','2026-03-01 16:53:13','2026-03-01 16:53:13',NULL),(24,'http://localhost:5000/uploads/1772383982488-download (10).jfif','b15112fe-6d3a-4859-92af-6fff80b92ef9','2026-03-01 16:53:13','2026-03-01 16:53:13',NULL),(25,'http://localhost:5000/uploads/1772384077244-download (15).jfif','323b5fda-0a68-464d-b2f7-2c7d83f67722','2026-03-01 16:56:04','2026-03-01 16:56:04',NULL),(26,'http://localhost:5000/uploads/1772384112837-download (14).jfif','323b5fda-0a68-464d-b2f7-2c7d83f67722','2026-03-01 16:56:04','2026-03-01 16:56:04',NULL),(27,'http://localhost:5000/uploads/1772384156763-download (13).jfif','323b5fda-0a68-464d-b2f7-2c7d83f67722','2026-03-01 16:56:04','2026-03-01 16:56:04',NULL),(28,'http://localhost:5000/uploads/1772384210017-download (18).jfif','71541820-8ee0-4386-858b-00fb6107f279','2026-03-01 16:57:17','2026-03-01 16:57:17',NULL),(29,'http://localhost:5000/uploads/1772384217494-download (17).jfif','71541820-8ee0-4386-858b-00fb6107f279','2026-03-01 16:57:17','2026-03-01 16:57:17',NULL),(30,'http://localhost:5000/uploads/1772384222626-download (16).jfif','71541820-8ee0-4386-858b-00fb6107f279','2026-03-01 16:57:17','2026-03-01 16:57:17',NULL),(31,'http://localhost:5000/uploads/1772384330121-download (21).jfif','82a95d10-49a6-48df-a5a8-6619a67bf3cc','2026-03-01 16:59:56','2026-03-01 16:59:56',NULL),(32,'http://localhost:5000/uploads/1772384335170-download (20).jfif','82a95d10-49a6-48df-a5a8-6619a67bf3cc','2026-03-01 16:59:56','2026-03-01 16:59:56',NULL),(33,'http://localhost:5000/uploads/1772384343972-download (19).jfif','82a95d10-49a6-48df-a5a8-6619a67bf3cc','2026-03-01 16:59:56','2026-03-01 16:59:56',NULL),(34,'http://localhost:5000/uploads/1772384508769-download (24).jfif','e3157836-e337-41ff-be84-c864ea370673','2026-03-01 17:02:16','2026-03-01 17:02:16',NULL),(35,'http://localhost:5000/uploads/1772384516575-download (23).jfif','e3157836-e337-41ff-be84-c864ea370673','2026-03-01 17:02:16','2026-03-01 17:02:16',NULL),(36,'http://localhost:5000/uploads/1772384521832-download (22).jfif','e3157836-e337-41ff-be84-c864ea370673','2026-03-01 17:02:16','2026-03-01 17:02:16',NULL),(49,'http://localhost:5000/uploads/1772623342486-download (27).jfif','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-04 21:38:59','2026-03-04 21:38:59',NULL),(50,'http://localhost:5000/uploads/1772623347724-download (26).jfif','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-04 21:38:59','2026-03-04 21:38:59',NULL),(51,'http://localhost:5000/uploads/1772623353048-download (25).jfif','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-04 21:38:59','2026-03-04 21:38:59',NULL),(52,'http://localhost:5000/uploads/1772383699027-download (1).jfif','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-05 02:25:47','2026-03-05 02:25:47',NULL),(53,'http://localhost:5000/uploads/1772383704207-download (2).jfif','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-05 02:25:47','2026-03-05 02:25:47',NULL),(54,'http://localhost:5000/uploads/1772383711424-download (3).jfif','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-05 02:25:47','2026-03-05 02:25:47',NULL);
/*!40000 ALTER TABLE `productimages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productratings`
--

DROP TABLE IF EXISTS `productratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `rating` int(11) NOT NULL,
  `review` text DEFAULT NULL,
  `userId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `ProductId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `images` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`images`)),
  `helpfulCount` int(11) DEFAULT 0,
  `orderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `product_ratings__product_id` (`ProductId`),
  KEY `product_ratings_user_id` (`userId`),
  KEY `orderId` (`orderId`),
  CONSTRAINT `ProductRatings_orderId_foreign_idx` FOREIGN KEY (`orderId`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT productratings_userId_fk FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT productratings_ProductId_fk FOREIGN KEY (ProductId) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT productratings_orderId_fk FOREIGN KEY (orderId) REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productratings`
--

LOCK TABLES `productratings` WRITE;
/*!40000 ALTER TABLE `productratings` DISABLE KEYS */;
INSERT INTO `productratings` VALUES (1,5,'good','b1be8dfe-dd12-4262-b313-602b665f57d8','2e801866-343e-44ad-9888-fcdc24521be4','2026-03-04 13:01:27','2026-03-04 13:01:27','[]',0,'4dc92aac-bfaf-47b6-8169-9e91e2df38b5'),(2,1,'bad','b1be8dfe-dd12-4262-b313-602b665f57d8','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-04 13:03:38','2026-03-04 13:03:38','[]',0,'9fe0a8fd-446a-4f33-b58b-77ca9fb57edf');
/*!40000 ALTER TABLE `productratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL,
  `stock` int(11) NOT NULL,
  `lowStockThreshold` int(11) DEFAULT 5,
  `embroideryStyle` varchar(255) DEFAULT 'Traditional Calado',
  `fabric` varchar(255) DEFAULT 'Pi├▒a-Seda Silk',
  `sellerId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `status` enum('pending','approved','rejected') DEFAULT 'approved',
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `CategoryId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  `shippingDays` int(11) DEFAULT 7,
  `availableColors` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`availableColors`)),
  `availableDesigns` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`availableDesigns`)),
  `shippingFee` decimal(10,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  KEY `products_seller_id` (`sellerId`),
  KEY `products_price` (`price`),
  KEY `products_name` (`name`),
  KEY `products__category_id` (`CategoryId`),
  CONSTRAINT `Products_CategoryId_foreign_idx` FOREIGN KEY (`CategoryId`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT products_sellerId_fk FOREIGN KEY (sellerId) REFERENCES users (id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT products_CategoryId_fk FOREIGN KEY (CategoryId) REFERENCES categories (id) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES ('1d491b18-f28c-4b77-b434-7361b706dad0','bading','goods',499.00,148,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-02 09:19:17','2026-03-07 16:05:56','3a1b7f2a-c250-4544-94d9-80019060cba2',7,'[\"red\",\"blue\",\"green\"]','[\"normal\",\"special\"]',0.00),('2e801866-343e-44ad-9888-fcdc24521be4','Filipiniana','',500.00,5,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-01 16:48:56','2026-03-05 02:25:47','b482e364-99ed-4ffc-8ba6-0c6b88ffdeca',7,'[]','[]',0.00),('323b5fda-0a68-464d-b2f7-2c7d83f67722','Pina','',500.00,18,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-01 16:56:04','2026-03-04 16:48:22','c3a6a27c-356c-4ee6-bff2-769c7dbbb263',7,'[]','[]',0.00),('4865d9e9-168c-49d3-af71-8f7c6ac3b137','Formal Barong','',500.00,48,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-01 16:50:44','2026-03-04 16:48:22','44222c1a-3227-44f8-bbce-e43cb34901c8',7,'[]','[]',0.00),('71541820-8ee0-4386-858b-00fb6107f279','Polo Barong','',500.00,18,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-01 16:57:17','2026-03-04 16:48:22','b55e8fc3-b095-4999-95b2-cc0676bb7f7a',7,'[]','[]',0.00),('82a95d10-49a6-48df-a5a8-6619a67bf3cc','Shirt Jack','',500.00,18,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-01 16:59:56','2026-03-04 16:48:22','013e7c59-ead9-45b9-b7ae-469024edf380',7,'[]','[]',0.00),('83716e60-fce5-4a42-81ff-4ad91e3fdcae','Jusi','',500.00,18,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-01 16:51:54','2026-03-04 16:48:22','c301ce8e-b7ca-43e8-9f67-cf823d529808',7,'[]','[]',0.00),('b15112fe-6d3a-4859-92af-6fff80b92ef9','Organza','',500.00,18,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-01 16:53:13','2026-03-04 16:48:22','3dd532f0-b343-406f-9801-59076f406b57',7,'[]','[]',0.00),('b7aea374-45e9-4361-afd7-9928474bf0b0','laundry','',500.00,500,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','pending','2026-02-26 14:52:32','2026-03-04 16:48:22',NULL,7,'[]','[]',0.00),('e3157836-e337-41ff-be84-c864ea370673','Bisayang barong','',8000.00,18,5,'Traditional Calado','Pi├▒a-Seda Silk','10a872be-ee27-4e11-9ff2-52e0910d2e5e','approved','2026-03-01 17:02:16','2026-03-04 16:48:22','f03f8813-3bc5-431b-a137-88ee937db72a',7,'[]','[]',0.00);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productsizes`
--

DROP TABLE IF EXISTS `productsizes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productsizes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `size` varchar(255) NOT NULL,
  `ProductId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ProductId` (`ProductId`),
  CONSTRAINT productsizes_ProductId_fk FOREIGN KEY (ProductId) REFERENCES products (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productsizes`
--

LOCK TABLES `productsizes` WRITE;
/*!40000 ALTER TABLE `productsizes` DISABLE KEYS */;
INSERT INTO `productsizes` VALUES (13,'s','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-04 21:38:59','2026-03-04 21:38:59'),(14,'m','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-04 21:38:59','2026-03-04 21:38:59'),(15,'l','1d491b18-f28c-4b77-b434-7361b706dad0','2026-03-04 21:38:59','2026-03-04 21:38:59');
/*!40000 ALTER TABLE `productsizes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `returnrequests`
--

DROP TABLE IF EXISTS `returnrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `returnrequests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reason` text DEFAULT NULL,
  `status` enum('Pending','Approved','Rejected') DEFAULT 'Pending',
  `proofImages` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`proofImages`)),
  `proofVideo` varchar(255) DEFAULT NULL,
  `requestedAt` datetime DEFAULT NULL,
  `OrderId` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `OrderId` (`OrderId`),
  CONSTRAINT returnrequests_OrderId_fk FOREIGN KEY (OrderId) REFERENCES orders (id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returnrequests`
--

LOCK TABLES `returnrequests` WRITE;
/*!40000 ALTER TABLE `returnrequests` DISABLE KEYS */;
/*!40000 ALTER TABLE `returnrequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemsettings`
--

DROP TABLE IF EXISTS `systemsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `systemsettings` (
  `key` varchar(255) NOT NULL,
  `value` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`value`)),
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemsettings`
--

LOCK TABLES `systemsettings` WRITE;
/*!40000 ALTER TABLE `systemsettings` DISABLE KEYS */;
/*!40000 ALTER TABLE `systemsettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` char(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','seller','customer') DEFAULT 'customer',
  `phone` varchar(255) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `shopName` varchar(255) DEFAULT NULL,
  `shopDescription` text DEFAULT NULL,
  `isVerified` tinyint(1) DEFAULT 0,
  `profileImage` varchar(255) DEFAULT NULL,
  `gcashNumber` varchar(255) DEFAULT NULL,
  `createdAt` datetime NOT NULL,
  `updatedAt` datetime NOT NULL,
  `facebook` varchar(255) DEFAULT NULL,
  `instagram` varchar(255) DEFAULT NULL,
  `tiktok` varchar(255) DEFAULT NULL,
  `twitter` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `users_email` (`email`),
  UNIQUE KEY `email_2` (`email`),
  UNIQUE KEY `email_3` (`email`),
  UNIQUE KEY `email_4` (`email`),
  UNIQUE KEY `email_5` (`email`),
  UNIQUE KEY `email_6` (`email`),
  UNIQUE KEY `email_7` (`email`),
  UNIQUE KEY `email_8` (`email`),
  UNIQUE KEY `email_9` (`email`),
  UNIQUE KEY `email_10` (`email`),
  UNIQUE KEY `email_11` (`email`),
  UNIQUE KEY `email_12` (`email`),
  UNIQUE KEY `email_13` (`email`),
  UNIQUE KEY `email_14` (`email`),
  UNIQUE KEY `email_15` (`email`),
  UNIQUE KEY `email_16` (`email`),
  UNIQUE KEY `email_17` (`email`),
  UNIQUE KEY `email_18` (`email`),
  UNIQUE KEY `email_19` (`email`),
  UNIQUE KEY `email_20` (`email`),
  UNIQUE KEY `email_21` (`email`),
  UNIQUE KEY `email_22` (`email`),
  UNIQUE KEY `email_23` (`email`),
  UNIQUE KEY `email_24` (`email`),
  UNIQUE KEY `email_25` (`email`),
  UNIQUE KEY `email_26` (`email`),
  UNIQUE KEY `email_27` (`email`),
  UNIQUE KEY `email_28` (`email`),
  UNIQUE KEY `email_29` (`email`),
  UNIQUE KEY `email_30` (`email`),
  UNIQUE KEY `email_31` (`email`),
  UNIQUE KEY `email_32` (`email`),
  UNIQUE KEY `email_33` (`email`),
  UNIQUE KEY `email_34` (`email`),
  UNIQUE KEY `email_35` (`email`),
  UNIQUE KEY `email_36` (`email`),
  UNIQUE KEY `email_37` (`email`),
  UNIQUE KEY `email_38` (`email`),
  UNIQUE KEY `email_39` (`email`),
  UNIQUE KEY `email_40` (`email`),
  UNIQUE KEY `email_41` (`email`),
  UNIQUE KEY `email_42` (`email`),
  UNIQUE KEY `email_43` (`email`),
  UNIQUE KEY `email_44` (`email`),
  UNIQUE KEY `email_45` (`email`),
  UNIQUE KEY `email_46` (`email`),
  UNIQUE KEY `email_47` (`email`),
  UNIQUE KEY `email_48` (`email`),
  UNIQUE KEY `email_49` (`email`),
  UNIQUE KEY `email_50` (`email`),
  UNIQUE KEY `email_51` (`email`),
  UNIQUE KEY `email_52` (`email`),
  UNIQUE KEY `email_53` (`email`),
  UNIQUE KEY `email_54` (`email`),
  UNIQUE KEY `email_55` (`email`),
  UNIQUE KEY `email_56` (`email`),
  UNIQUE KEY `email_57` (`email`),
  UNIQUE KEY `email_58` (`email`),
  UNIQUE KEY `email_59` (`email`),
  UNIQUE KEY `email_60` (`email`),
  UNIQUE KEY `email_61` (`email`),
  KEY `users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('0bd8cf7c-00eb-47e4-9552-ef5ab93021b7','bading','bading@gmail.com','$2b$10$oBMGANDUDggVqReRd68Z0e6WbzwHoXDoSsscRZDwc/V7Xu4MD0e2G','seller',NULL,NULL,'bads',' b nbbn',0,NULL,'03213201652v','2026-03-08 09:31:45','2026-03-08 09:31:45',NULL,NULL,NULL,NULL),('10a872be-ee27-4e11-9ff2-52e0910d2e5e','Maria Clara','artisan@lumban.ph','$2b$10$OoH4CF9VNF/JE395OqVPeu2buU0t3DvEZ7vqn9YlX9igV6Dlhq1gy','seller','09073931241',NULL,'Barong ni mk','dont panic its organic',1,'http://localhost:5000/uploads/1772628389394-download (22).jfif','09073931241','2026-02-25 19:28:55','2026-03-07 13:02:28','https://www.facebook.com/',NULL,NULL,NULL),('3cbc22c8-9d25-4e11-a7c7-7d93f158dfc9','Test Buyer','testbuyer@example.com','$2b$10$em7qqugoyGjqn/uzYMQpcO3L5cHX7imv0PqiZxNYb3am6c1C5QoGa','customer',NULL,NULL,NULL,NULL,1,NULL,NULL,'2026-02-25 20:01:10','2026-02-25 20:01:10',NULL,NULL,NULL,NULL),('6baf8440-2a34-41a9-a9db-563563efcbd0','Admin User','admin@lumbarong.ph','$2b$10$OoH4CF9VNF/JE395OqVPeu8M9u10Ww4d.H9FRunh50eZUuo6.V/NC','admin',NULL,NULL,NULL,NULL,1,NULL,NULL,'2026-02-25 19:28:55','2026-02-25 19:28:55',NULL,NULL,NULL,NULL),('ac8faf27-99a0-4a9e-a1e0-05b8832776df','Ailo','ailo@gmail.com','$2b$10$MPbdwFkdkkBcod90K7xz0uO.26qgDaKGs3lIS.IGKejpmSopW.3e6','customer',NULL,NULL,NULL,NULL,1,NULL,NULL,'2026-02-27 18:17:21','2026-02-27 18:17:21',NULL,NULL,NULL,NULL),('b1be8dfe-dd12-4262-b313-602b665f57d8','Juan Dela Cruz','juan@example.ph','$2b$10$OoH4CF9VNF/JE395OqVPeuwSQ0P/BsHM8VR6T8iHt7dK2mgmayyfC','customer','0000000000000000000000000000000000000000000000000000000000000000000000000',NULL,NULL,NULL,1,NULL,NULL,'2026-02-25 19:28:55','2026-03-05 02:23:34',NULL,NULL,NULL,NULL),('b67e6b7f-d368-4d4d-ada5-58a2c8ea0ef4','Test User','test@example.com','$2b$10$vo5Ql.vhEzkKdlfvshRpMeE9wD8ypr8anXQer91JOHLB7YkbH7b2C','customer',NULL,NULL,NULL,NULL,1,NULL,NULL,'2026-03-05 17:40:07','2026-03-05 17:40:07',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-03-10  0:31:41
SET FOREIGN_KEY_CHECKS=1;
