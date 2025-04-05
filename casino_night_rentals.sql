-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 05, 2025 at 07:25 PM
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
(2, 'Alex', 'Alex', 'Maiko', 'maiko052@gmail.com', '0796901210', '$2b$10$VEDERi4lFAM.KDyEGN..9.wTbaUjn/UI4MsIjEvA/uS88a9tFUawO', '2025-04-02 17:31:36', 1);

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
  `number_of_customers` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `dealer_assignments`
--

INSERT INTO `dealer_assignments` (`id`, `service_booking_id`, `dealer_id`, `assigned_at`, `service_id`, `number_of_customers`) VALUES
(10, 2, 2, '2025-04-05 16:15:31', 1, 50);

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

--
-- Dumping data for table `event_product_booking`
--

INSERT INTO `event_product_booking` (`id`, `customer_id`, `product_id`, `status`, `created_at`, `payment_id`) VALUES
(3, 2, 3, 'confirmed', '2025-04-04 11:32:08', 16),
(4, 1, 2, 'confirmed', '2025-04-04 12:30:07', 14),
(5, 1, 3, 'confirmed', '2025-04-04 12:30:07', 14),
(7, 1, 3, 'reserved', '2025-04-04 12:30:10', 15),
(8, 1, 1, 'reserved', '2025-04-04 15:19:34', 13);

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

--
-- Dumping data for table `order_items`
--

INSERT INTO `order_items` (`id`, `payment_id`, `product_id`, `quantity`) VALUES
(9, 13, 1, 2),
(10, 14, 2, 2),
(11, 14, 3, 1),
(12, 15, 3, 1),
(13, 16, 3, 1);

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

--
-- Dumping data for table `payments`
--

INSERT INTO `payments` (`id`, `reference_code`, `customer_id`, `payment_method`, `status`, `total_amount`, `created_at`) VALUES
(13, 'QWERF34FDRE214', 1, 'bank', 'approved', 2000.00, '2025-04-03 17:56:27'),
(14, 'QWERTFD234', 1, 'mpesa', 'approved', 3900.00, '2025-04-03 17:59:25'),
(15, 'QWERTFRD32', 1, 'mpesa', 'approved', 1500.00, '2025-04-03 18:00:59'),
(16, 'QWERTY32QW', 2, 'mpesa', 'approved', 1500.00, '2025-04-03 18:05:56');

-- --------------------------------------------------------

--
-- Table structure for table `products`
--

CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `quantity` int(11) NOT NULL,
  `rental_price` decimal(10,2) NOT NULL,
  `image_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `products`
--

INSERT INTO `products` (`id`, `name`, `quantity`, `rental_price`, `image_url`) VALUES
(1, 'L.E.D ROULETTE TABLE\r\n', 48, 1000.00, 'https://tcsjohnhuxley.com/wp-content/uploads/2023/03/Blaze-Roulette-Gaming-Table-Background-1.jpg'),
(2, 'L.E.D BLACKJACK TABLE', 98, 1200.00, 'https://cocoeventsnyc.com/wp-content/uploads/2023/04/light-up-black-jack-3.jpg'),
(3, 'POKER TABLE', 97, 1500.00, 'https://m.media-amazon.com/images/I/61irFiMDcFL._AC_SL1500_.jpg');

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

--
-- Dumping data for table `product_cart`
--

INSERT INTO `product_cart` (`id`, `customer_id`, `product_name`, `quantity`, `rental_price`, `image_url`, `created_at`, `product_id`) VALUES
(42, 1, 'L.E.D ROULETTE TABLE\r\n', 1, 1000.00, 'https://tcsjohnhuxley.com/wp-content/uploads/2023/03/Blaze-Roulette-Gaming-Table-Background-1.jpg', '2025-04-05 07:17:30', 1);

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

--
-- Dumping data for table `service_booking`
--

INSERT INTO `service_booking` (`id`, `customer_id`, `service_id`, `event_date`, `number_of_people`, `booking_fee`, `payment_method`, `reference_code`, `status`, `created_at`) VALUES
(2, 1, 1, '2025-04-05', 50, 5000.00, 'mpesa', 'qwerfgdf23', 'assigned', '2025-04-05 07:08:28'),
(3, 2, 4, '2025-04-10', 10, 200.00, 'mpesa', 'QWERFDE43E', 'approved', '2025-04-05 07:16:44'),
(4, 1, 4, '2025-04-25', 20, 200.00, 'mpesa', 'QWE32RTF4W', 'assigned', '2025-04-05 07:18:34'),
(5, 1, 4, '2025-04-25', 20, 200.00, 'mpesa', 'QWE32RTF4W', 'assigned', '2025-04-05 07:18:38'),
(6, 1, 1, '2025-04-25', 2, 200.00, 'mpesa', 'QWERTF34TY', 'assigned', '2025-04-05 07:27:53'),
(7, 1, 1, '0000-00-00', 27, 200.00, 'mpesa', 'QWE54FGTRD', 'approved', '2025-04-05 07:29:23'),
(8, 1, 1, '2025-04-07', 15, 200.00, 'mpesa', 'QWERFYGFD4', 'pending', '2025-04-05 07:34:08'),
(9, 1, 1, '2025-05-10', 99, 200.00, 'mpesa', 'QWED34ERF3', 'assigned', '2025-04-05 07:48:40');

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

--
-- Indexes for dumped tables
--

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `dealers`
--
ALTER TABLE `dealers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `dealer_assignments`
--
ALTER TABLE `dealer_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `event_manager`
--
ALTER TABLE `event_manager`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `event_product_booking`
--
ALTER TABLE `event_product_booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `payments`
--
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `products`
--
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `product_cart`
--
ALTER TABLE `product_cart`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

--
-- AUTO_INCREMENT for table `services`
--
ALTER TABLE `services`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `service_booking`
--
ALTER TABLE `service_booking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `service_manager`
--
ALTER TABLE `service_manager`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

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
-- Constraints for table `dealer_assignments`
--
ALTER TABLE `dealer_assignments`
  ADD CONSTRAINT `dealer_assignments_ibfk_1` FOREIGN KEY (`service_booking_id`) REFERENCES `service_booking` (`id`),
  ADD CONSTRAINT `dealer_assignments_ibfk_2` FOREIGN KEY (`dealer_id`) REFERENCES `dealers` (`id`),
  ADD CONSTRAINT `dealer_assignments_ibfk_3` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`);

--
-- Constraints for table `event_product_booking`
--
ALTER TABLE `event_product_booking`
  ADD CONSTRAINT `event_product_booking_ibfk_1` FOREIGN KEY (`customer_id`) REFERENCES `customers` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `event_product_booking_ibfk_2` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_payment_id` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE;

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
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
