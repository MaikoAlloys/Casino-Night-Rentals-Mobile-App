-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 11, 2025 at 02:22 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `casino_night_rentals`
--

-- --------------------------------------------------------

--
-- Table structure for table `admin`
--

CREATE TABLE `admin` (
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `admin`
--

INSERT INTO `admin` (`username`, `password`) VALUES
('admin', '1234');

-- --------------------------------------------------------

--
-- Table structure for table `cart`
--

CREATE TABLE `cart` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `product_id` int(11) DEFAULT NULL,
  `quantity` int(11) DEFAULT NULL,
  `total_cost` decimal(10,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `customers`
--

CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `is_approved` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `customers`
--

INSERT INTO `customers` (`id`, `username`, `first_name`, `last_name`, `email`, `phone_number`, `password`, `created_at`, `is_approved`) VALUES
(1, 'Phoebe', 'Phoebe', 'Siaka', 'maikoa052@gmail.com', '0796901211', '$2b$10$R42J8jpyZWiZLUG2rHqyY.z9GWAB2Fl.7gqK09iq8RWAdrJqG71qG', '2025-04-02 17:16:49', 1),
(2, 'Alex', 'Alex', 'Maiko', 'maiko052@gmail.com', '0796901210', '$2b$10$VEDERi4lFAM.KDyEGN..9.wTbaUjn/UI4MsIjEvA/uS88a9tFUawO', '2025-04-02 17:31:36', 1),
(3, 'Sammy', 'Sammy', 'Mwangi ', 'maikoaalloys@gmail.com', '0796901230', '$2b$10$MB6X0.5ChKbnl59ZHu0liOp4pQrXNcHsrQhuUboy5sx8PZFJGFByC', '2025-04-08 06:21:06', 1);

-- --------------------------------------------------------

--
-- Table structure for table `customer_service_payment`
--

CREATE TABLE `customer_service_payment` (
  `id` int(11) NOT NULL,
  `total_cost` decimal(10,2) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `service_booking_id` int(11) NOT NULL,
  `payment_method` enum('mpesa','bank') NOT NULL,
  `reference_code` varchar(100) NOT NULL,
  `status` enum('pending','approved','released','completed','confirmed') DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dealers`
--

CREATE TABLE `dealers` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dealers`
--

INSERT INTO `dealers` (`id`, `username`, `first_name`, `last_name`, `email`, `phone_number`, `password`, `created_at`) VALUES
(1, 'Stephen', 'Stephen', 'Mwangi', 'stephen.mwangi@gmail.com', '0711001100', '$2b$10$arASIO.PygXoWZ7CMYse5uaQq/aICJ9FeONX0cl/RsvBPDdhFwCfq', '2025-04-05 13:08:50'),
(2, 'Doris', 'Doris', 'Kerubo', 'doris.kerubo@gmail.com', '0722002200', '$2b$10$irefyLncLy0UJf2bhDal6O6AUW.4jnlIKBh7WOL.V8O0R7M5WxY16', '2025-04-05 13:08:50'),
(3, 'Dancun', 'Dancun', 'Kaguyo', 'dancun.kaguyo@gmail.com', '0733003300', '$2b$10$OGuKKK95iaY5WuPODBOkQOHMk/NbztUNLxmHn2O2AHQA5/HipeG3m', '2025-04-05 13:08:50');

-- --------------------------------------------------------

--
-- Table structure for table `dealer_assignments`
--

CREATE TABLE `dealer_assignments` (
  `id` int(11) NOT NULL,
  `service_booking_id` int(11) NOT NULL,
  `dealer_id` int(11) NOT NULL,
  `assigned_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `service_id` int(11) NOT NULL,
  `number_of_customers` int(11) DEFAULT NULL,
  `status` enum('pending','submitted') NOT NULL DEFAULT 'pending'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `dealer_selected_items`
--

CREATE TABLE `dealer_selected_items` (
  `id` int(11) NOT NULL,
  `store_item_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `dealer_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `item_cost` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `status` enum('pending','paid','approved') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `service_booking_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `event_manager`
--

CREATE TABLE `event_manager` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `event_manager`
--

INSERT INTO `event_manager` (`id`, `username`, `first_name`, `last_name`, `email`, `phone_number`, `password`, `created_at`) VALUES
(1, 'Grace', 'Grace', 'Mwangi', 'grace.mwangi@gmail.com', '0740511256', '$2b$10$IiwUopRx6POQFiI02PzVQeVVBY3rqL9ytxuggp36x8Aa4W4mEuo6O', '2025-04-04 09:02:19');

-- --------------------------------------------------------

--
-- Table structure for table `event_product_booking`
--

CREATE TABLE `event_product_booking` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `status` enum('pending','reserved','confirmed') NOT NULL DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `payment_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `feedback`
--

CREATE TABLE `feedback` (
  `feedback_id` int(11) NOT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `dealer_id` int(11) DEFAULT NULL,
  `service_manager_id` int(11) DEFAULT NULL,
  `finance_id` int(11) DEFAULT NULL,
  `event_manager_id` int(11) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `rating` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('pending','resolved') DEFAULT 'pending',
  `reply` text DEFAULT NULL,
  `reply_by` varchar(255) DEFAULT NULL,
  `reply_time` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `finance`
--

CREATE TABLE `finance` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `finance`
--

INSERT INTO `finance` (`id`, `username`, `first_name`, `last_name`, `email`, `phone_number`, `password`, `created_at`) VALUES
(1, 'Daniel', 'Daniel', 'Mwangi', 'danielmwangi@gmail.com', '0796901211', '$2b$10$0Qc8Ddy/kFPXrgvtVtdlje2T5DuQ3/wKUMmW6/Gf33uL6czEC1n22', '2025-04-04 06:18:14');

-- --------------------------------------------------------

--
-- Table structure for table `orders`
--

CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `status` enum('pending','approved') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `order_items`
--

CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `payments`
--

CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `reference_code` varchar(14) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `payment_method` enum('mpesa','bank') NOT NULL,
  `status` enum('pending','approved') NOT NULL DEFAULT 'pending',
  `total_amount` decimal(10,2) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `rental_price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `total_cost` decimal(10,2) NOT NULL DEFAULT 13000.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `quantity`, `rental_price`, `image_url`, `total_cost`) VALUES
(1, 'L.E.D ROULETTE TABLE\r\n', 70, 1000.00, 'https://tcsjohnhuxley.com/wp-content/uploads/2023/03/Blaze-Roulette-Gaming-Table-Background-1.jpg', 13000.00),
(2, 'L.E.D BLACKJACK TABLE', 100, 1200.00, 'https://cocoeventsnyc.com/wp-content/uploads/2023/04/light-up-black-jack-3.jpg', 13000.00),
(3, 'POKER TABLE', 92, 1500.00, 'https://m.media-amazon.com/images/I/61irFiMDcFL._AC_SL1500_.jpg', 13000.00);

-- --------------------------------------------------------

--
-- Table structure for table `product_cart`
--

CREATE TABLE `product_cart` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `rental_price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `product_id` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `services`
--

CREATE TABLE `services` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `service_fee` decimal(10,2) NOT NULL,
  `booking_fee` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `services`
--

INSERT INTO `services` (`id`, `name`, `service_fee`, `booking_fee`) VALUES
(1, 'Corporate Event', 12000.00, 200.00),
(2, 'Product Launch', 15000.00, 200.00),
(3, 'Birthday Party', 10000.00, 200.00),
(4, 'End Year Party', 14000.00, 200.00),
(5, 'Game Night', 11000.00, 200.00),
(6, 'Get Together', 10500.00, 200.00),
(7, 'Product Launch', 15000.00, 200.00);

-- --------------------------------------------------------

--
-- Table structure for table `service_booking`
--

CREATE TABLE `service_booking` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `event_date` date NOT NULL,
  `number_of_people` int(11) NOT NULL,
  `booking_fee` decimal(10,2) NOT NULL,
  `payment_method` enum('mpesa','bank') NOT NULL,
  `reference_code` varchar(100) NOT NULL,
  `status` enum('pending','approved','assigned') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `service_manager`
--

CREATE TABLE `service_manager` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `service_manager`
--

INSERT INTO `service_manager` (`id`, `username`, `first_name`, `last_name`, `email`, `phone_number`, `password`, `created_at`) VALUES
(1, 'John', 'John', 'Kangeth\'e', 'john.kangethe@gmail.com', '0789342312', '$2b$10$aItDzTTdKEIrfNXVk3vEQ./eAEz2GpZ4hAeOnz3jS7Ec2hr4BeTuK', '2025-04-05 12:30:46');

-- --------------------------------------------------------

--
-- Table structure for table `storekeeper`
--

CREATE TABLE `storekeeper` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `storekeeper`
--

INSERT INTO `storekeeper` (`id`, `username`, `first_name`, `last_name`, `email`, `phone_number`, `password`, `created_at`) VALUES
(1, 'Tim', 'Tim', 'Wanyonyi', 'timwanyonyi@gmail.com', '0711222333', '$2b$10$TC3zc.3EFMkr4lYlUub8o.oTipRALUe3bK/9EHj7nukqlMkQxKtke', '2025-04-06 11:23:31');

-- --------------------------------------------------------

--
-- Table structure for table `storekeeper_selected_items`
--

CREATE TABLE `storekeeper_selected_items` (
  `id` int(11) NOT NULL,
  `item_id` int(11) NOT NULL,
  `item_type` enum('product','service') NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL,
  `total_cost` decimal(10,2) NOT NULL,
  `status` enum('pending','approved','received','paid') DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `store_items`
--

CREATE TABLE `store_items` (
  `id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `item_name` varchar(100) NOT NULL,
  `item_cost_per_person` decimal(10,2) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `store_items`
--

INSERT INTO `store_items` (`id`, `service_id`, `item_name`, `item_cost_per_person`, `quantity`, `created_at`) VALUES
(1, 1, 'PA System', 3000.00, 109, '2025-04-06 06:25:22'),
(2, 1, 'TV Screen ', 1500.00, 106, '2025-04-06 06:25:22'),
(3, 1, 'Conference Chairs', 100.00, 102, '2025-04-06 06:25:22'),
(4, 1, 'Corporate Banners', 50.00, 105, '2025-04-06 06:25:22'),
(5, 1, 'Lunch Catering', 300.00, 100, '2025-04-06 06:25:22'),
(6, 2, 'LED Lighting Setup', 1000.00, 100, '2025-04-06 06:25:22'),
(7, 2, 'Stage & Backdrop Design', 180.00, 100, '2025-04-06 06:25:22'),
(8, 2, 'Launch Decorations', 90.00, 100, '2025-04-06 06:25:22'),
(9, 2, 'Branded Giveaways', 60.00, 100, '2025-04-06 06:25:22'),
(10, 2, 'Catering (Snacks & Drinks)', 250.00, 100, '2025-04-06 06:25:22'),
(11, 3, 'Birthday Cake', 150.00, 100, '2025-04-06 06:25:22'),
(12, 3, 'Decorations & Balloons', 100.00, 99, '2025-04-06 06:25:22'),
(13, 3, 'Entertainment (DJ/MC)', 1200.00, 100, '2025-04-06 06:25:22'),
(14, 3, 'Party Packs for Kids', 80.00, 86, '2025-04-06 06:25:22'),
(15, 3, 'Food & Soft Drinks', 200.00, 100, '2025-04-06 06:25:22'),
(16, 4, 'Sound & DJ Equipment', 180.00, 97, '2025-04-06 06:25:22'),
(17, 4, 'Tents & Seating', 150.00, 97, '2025-04-06 06:25:22'),
(18, 4, 'Buffet Catering', 300.00, 100, '2025-04-06 06:25:22'),
(19, 4, 'Decor & Lighting', 100.00, 97, '2025-04-06 06:25:22'),
(20, 4, 'Photo Booth Setup', 90.00, 100, '2025-04-06 06:25:22'),
(21, 5, 'Card & Board Games', 60.00, 92, '2025-04-06 06:25:22'),
(22, 5, 'Game Tables & Chairs', 80.00, 100, '2025-04-06 06:25:22'),
(23, 5, 'Lighting Setup', 1000.00, 90, '2025-04-06 06:25:22'),
(24, 5, 'Drinks', 100.00, 100, '2025-04-06 06:25:22'),
(25, 5, 'MC or Host', 5000.00, 100, '2025-04-06 06:25:22'),
(26, 6, 'Basic Seating Setup', 60.00, 100, '2025-04-06 06:25:22'),
(27, 6, 'Light Meals & Refreshments', 150.00, 100, '2025-04-06 06:25:22'),
(28, 6, 'PA System', 100.00, 100, '2025-04-06 06:25:22'),
(29, 6, 'Decorations', 80.00, 100, '2025-04-06 06:25:22'),
(30, 6, 'Games & Icebreakers', 90.00, 103, '2025-04-06 06:25:22'),
(31, 7, 'Display Booths', 140.00, 100, '2025-04-06 06:25:22'),
(32, 7, 'Stage Lighting', 130.00, 100, '2025-04-06 06:25:22'),
(33, 7, 'Brochure Printing', 60.00, 100, '2025-04-06 06:25:22'),
(34, 7, 'Host/Presenter', 100.00, 100, '2025-04-06 06:25:22'),
(35, 7, 'Catering & Drinks', 220.00, 100, '2025-04-06 06:25:22');

-- --------------------------------------------------------

--
-- Table structure for table `suppliers`
--

CREATE TABLE `suppliers` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone_number` varchar(15) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `suppliers`
--

INSERT INTO `suppliers` (`id`, `username`, `first_name`, `last_name`, `email`, `phone_number`, `password`, `created_at`) VALUES
(1, 'Danstan', 'Danstan', 'Mwangi', 'danstan.mwangi@gmail.com', '0712345678', '$2b$10$gJOGr1X5IO74fnvV5GU4g.aeq3IQNmDccJxppvDXbX1PhMLyN9R5m', '2025-04-08 05:59:31'),
(2, 'Victor', 'Victor', 'Mwendwa', 'victor.mwendwa@gmail.com', '0723456789', '$2b$10$CTgmAMKqyL2u/0La0Guep.Cadg3L3YAZGHL3pqxK1NlDM3NtvU12i', '2025-04-08 05:59:31'),
(3, 'Cynthia', 'Cynthia', 'Njeri', 'cynthia.njeri@gmail.com', '0734567890', '$2b$10$b2PlkGCYGkOacBQ8dWYdOO27wK/KI.a291/RO6YYCGQDh0Rw0lXOm', '2025-04-08 05:59:31');

-- --------------------------------------------------------

--
-- Table structure for table `supplier_payments`
--

CREATE TABLE `supplier_payments` (
  `id` int(11) NOT NULL,
  `payment_method` enum('mpesa','bank') NOT NULL,
  `status` enum('pending','approved') DEFAULT 'pending',
  `reference_code` varchar(50) NOT NULL,
  `supplier_id` int(11) NOT NULL,
  `storekeeper_selected_item_id` int(11) NOT NULL,
  `paid_amount` decimal(10,2) NOT NULL,
  `payment_date` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `admin`
--
ALTER TABLE `admin`
  ADD PRIMARY KEY (`username`);

--
-- Indexes for table `cart`
--
ALTER TABLE `cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `customers`
--
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone_number` (`phone_number`);

--
-- Indexes for table `customer_service_payment`
--
ALTER TABLE `customer_service_payment`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `service_booking_id` (`service_booking_id`);

--
-- Indexes for table `dealers`
--
ALTER TABLE `dealers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `dealer_assignments`
--
ALTER TABLE `dealer_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_booking_id` (`service_booking_id`),
  ADD KEY `dealer_id` (`dealer_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `dealer_selected_items`
--
ALTER TABLE `dealer_selected_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `store_item_id` (`store_item_id`),
  ADD KEY `service_id` (`service_id`),
  ADD KEY `dealer_id` (`dealer_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `fk_service_booking` (`service_booking_id`);

--
-- Indexes for table `event_manager`
--
ALTER TABLE `event_manager`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `event_product_booking`
--
ALTER TABLE `event_product_booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `product_id` (`product_id`),
  ADD KEY `fk_payment_id` (`payment_id`);

--
-- Indexes for table `feedback`
--
ALTER TABLE `feedback`
  ADD PRIMARY KEY (`feedback_id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `dealer_id` (`dealer_id`),
  ADD KEY `service_manager_id` (`service_manager_id`),
  ADD KEY `finance_id` (`finance_id`),
  ADD KEY `event_manager_id` (`event_manager_id`);

--
-- Indexes for table `finance`
--
ALTER TABLE `finance`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`),
  ADD UNIQUE KEY `phone_number` (`phone_number`);

--
-- Indexes for table `orders`
--
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `order_items`
--
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `payment_id` (`payment_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `payments`
--
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `reference_code` (`reference_code`),
  ADD KEY `customer_id` (`customer_id`);

--
-- Indexes for table `products`
--
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `product_cart`
--
ALTER TABLE `product_cart`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `product_id` (`product_id`);

--
-- Indexes for table `services`
--
ALTER TABLE `services`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `service_booking`
--
ALTER TABLE `service_booking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `customer_id` (`customer_id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `service_manager`
--
ALTER TABLE `service_manager`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `storekeeper`
--
ALTER TABLE `storekeeper`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `storekeeper_selected_items`
--
ALTER TABLE `storekeeper_selected_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `fk_supplier` (`supplier_id`);

--
-- Indexes for table `store_items`
--
ALTER TABLE `store_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `service_id` (`service_id`);

--
-- Indexes for table `suppliers`
--
ALTER TABLE `suppliers`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `supplier_payments`
--
ALTER TABLE `supplier_payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `supplier_id` (`supplier_id`),
  ADD KEY `storekeeper_selected_item_id` (`storekeeper_selected_item_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `cart`
--
ALTER TABLE `cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `customers`
--
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `customer_service_payment`
--
ALTER TABLE `customer_service_payment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `dealers`
--
ALTER TABLE `dealers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `dealer_assignments`
--
ALTER TABLE `dealer_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `dealer_selected_items`
--
ALTER TABLE `dealer_selected_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=34;

--
-- AUTO_INCREMENT for table `event_manager`
--
ALTER TABLE `event_manager`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `event_product_booking`
--
ALTER TABLE `event_product_booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `feedback`
--
ALTER TABLE `feedback`
  MODIFY `feedback_id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `finance`
--
ALTER TABLE `finance`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `orders`
--
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `order_items`
--
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=18;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `product_cart`
--
ALTER TABLE `product_cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=44;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `service_booking`
--
ALTER TABLE `service_booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `service_manager`
--
ALTER TABLE `service_manager`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `storekeeper`
--
ALTER TABLE `storekeeper`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `storekeeper_selected_items`
--
ALTER TABLE `storekeeper_selected_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `store_items`
--
ALTER TABLE `store_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=36;

--
-- AUTO_INCREMENT for table `suppliers`
--
ALTER TABLE `suppliers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `supplier_payments`
--
ALTER TABLE `supplier_payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `cart`
--
ALTER TABLE `cart`
  ADD CONSTRAINT `cart_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `customer_service_payment`
--
ALTER TABLE `customer_service_payment`
  ADD CONSTRAINT `customer_service_payment_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `customer_service_payment_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `customer_service_payment_ibfk_3` FOREIGN KEY (`service_booking_id`) REFERENCES `service_booking` (`id`);

--
-- Constraints for table `dealer_assignments`
--
ALTER TABLE `dealer_assignments`
  ADD CONSTRAINT `dealer_assignments_ibfk_1` FOREIGN KEY (`service_booking_id`) REFERENCES `service_booking` (`id`),
  ADD CONSTRAINT `dealer_assignments_ibfk_2` FOREIGN KEY (`dealer_id`) REFERENCES `dealers` (`id`),
  ADD CONSTRAINT `dealer_assignments_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `dealer_selected_items`
--
ALTER TABLE `dealer_selected_items`
  ADD CONSTRAINT `dealer_selected_items_ibfk_1` FOREIGN KEY (`store_item_id`) REFERENCES `store_items` (`id`),
  ADD CONSTRAINT `dealer_selected_items_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  ADD CONSTRAINT `dealer_selected_items_ibfk_3` FOREIGN KEY (`dealer_id`) REFERENCES `dealers` (`id`),
  ADD CONSTRAINT `dealer_selected_items_ibfk_4` FOREIGN KEY (`customer_id`) REFERENCES `service_booking` (`customer_id`),
  ADD CONSTRAINT `fk_service_booking` FOREIGN KEY (`service_booking_id`) REFERENCES `service_booking` (`id`);

--
-- Constraints for table `event_product_booking`
--
ALTER TABLE `event_product_booking`
  ADD CONSTRAINT `event_product_booking_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_product_booking_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `feedback`
--
ALTER TABLE `feedback`
  ADD CONSTRAINT `feedback_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `feedback_ibfk_2` FOREIGN KEY (`dealer_id`) REFERENCES `dealers` (`id`),
  ADD CONSTRAINT `feedback_ibfk_3` FOREIGN KEY (`service_manager_id`) REFERENCES `service_manager` (`id`),
  ADD CONSTRAINT `feedback_ibfk_4` FOREIGN KEY (`finance_id`) REFERENCES `finance` (`id`),
  ADD CONSTRAINT `feedback_ibfk_5` FOREIGN KEY (`event_manager_id`) REFERENCES `event_manager` (`id`);

--
-- Constraints for table `orders`
--
ALTER TABLE `orders`
  ADD CONSTRAINT `orders_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `orders_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `order_items`
--
ALTER TABLE `order_items`
  ADD CONSTRAINT `order_items_ibfk_1` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `order_items_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `payments`
--
ALTER TABLE `payments`
  ADD CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `product_cart`
--
ALTER TABLE `product_cart`
  ADD CONSTRAINT `product_cart_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `product_cart_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`);

--
-- Constraints for table `service_booking`
--
ALTER TABLE `service_booking`
  ADD CONSTRAINT `service_booking_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`),
  ADD CONSTRAINT `service_booking_ibfk_2` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `storekeeper_selected_items`
--
ALTER TABLE `storekeeper_selected_items`
  ADD CONSTRAINT `fk_supplier` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`);

--
-- Constraints for table `store_items`
--
ALTER TABLE `store_items`
  ADD CONSTRAINT `store_items_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `supplier_payments`
--
ALTER TABLE `supplier_payments`
  ADD CONSTRAINT `supplier_payments_ibfk_1` FOREIGN KEY (`supplier_id`) REFERENCES `suppliers` (`id`),
  ADD CONSTRAINT `supplier_payments_ibfk_2` FOREIGN KEY (`storekeeper_selected_item_id`) REFERENCES `storekeeper_selected_items` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
