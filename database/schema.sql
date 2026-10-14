-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: db_proyecto
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `clases_programadas`
--

DROP TABLE IF EXISTS `clases_programadas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clases_programadas` (
  `idClases_programadas` int NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `Instructor` varchar(45) NOT NULL,
  `categoria` varchar(45) NOT NULL,
  `cupo_total` int NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `fechayhora_inicio` datetime NOT NULL,
  `fechayhora_final` datetime NOT NULL,
  PRIMARY KEY (`idClases_programadas`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `compra`
--

DROP TABLE IF EXISTS `compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compra` (
  `idcompra` int NOT NULL,
  `fecha_compra` datetime NOT NULL,
  `precio_pagado` decimal(10,0) NOT NULL,
  `usuarios_idusuarios` int NOT NULL,
  `Paquetes_idPaquetes` int NOT NULL,
  PRIMARY KEY (`idcompra`),
  KEY `fk_compra_usuarios_idx` (`usuarios_idusuarios`),
  KEY `fk_compra_Paquetes1_idx` (`Paquetes_idPaquetes`),
  CONSTRAINT `fk_compra_Paquetes1` FOREIGN KEY (`Paquetes_idPaquetes`) REFERENCES `paquetes` (`idPaquetes`),
  CONSTRAINT `fk_compra_usuarios` FOREIGN KEY (`usuarios_idusuarios`) REFERENCES `usuarios` (`idusuarios`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `marcas_personales`
--

DROP TABLE IF EXISTS `marcas_personales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marcas_personales` (
  `idMarca` int NOT NULL,
  `ejercicio` varchar(120) NOT NULL,
  `tipo_marca` varchar(45) NOT NULL,
  `valor` decimal(12,3) NOT NULL,
  `unidad` varchar(45) NOT NULL,
  `fecha_logro` date NOT NULL,
  `usuarios_idusuarios` int NOT NULL,
  PRIMARY KEY (`idMarca`),
  KEY `fk_Marcas_personales_usuarios1_idx` (`usuarios_idusuarios`),
  CONSTRAINT `fk_Marcas_personales_usuarios1` FOREIGN KEY (`usuarios_idusuarios`) REFERENCES `usuarios` (`idusuarios`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `paquetes`
--

DROP TABLE IF EXISTS `paquetes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `paquetes` (
  `idPaquetes` int NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `cantidad_clases` int NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `descripcion` text NOT NULL,
  PRIMARY KEY (`idPaquetes`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reserva`
--

DROP TABLE IF EXISTS `reserva`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reserva` (
  `idreserva` int NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `estado` varchar(45) NOT NULL,
  `fechayhora_asistencia` datetime NOT NULL,
  `usuarios_idusuarios` int NOT NULL,
  `Clases_programadas_idClases_programadas` int NOT NULL,
  PRIMARY KEY (`idreserva`),
  KEY `fk_reserva_usuarios1_idx` (`usuarios_idusuarios`),
  KEY `fk_reserva_Clases_programadas1_idx` (`Clases_programadas_idClases_programadas`),
  CONSTRAINT `fk_reserva_Clases_programadas1` FOREIGN KEY (`Clases_programadas_idClases_programadas`) REFERENCES `clases_programadas` (`idClases_programadas`),
  CONSTRAINT `fk_reserva_usuarios1` FOREIGN KEY (`usuarios_idusuarios`) REFERENCES `usuarios` (`idusuarios`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `reseñas`
--

DROP TABLE IF EXISTS `reseñas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reseñas` (
  `idreserva` int NOT NULL,
  `calificacion` tinyint NOT NULL,
  `comentario` text NOT NULL,
  `fecha_creacion` datetime NOT NULL,
  `ultima_actualizacion` datetime NOT NULL,
  `etiquetas` json NOT NULL,
  PRIMARY KEY (`idreserva`),
  CONSTRAINT `fk_resenas_reserva` FOREIGN KEY (`idreserva`) REFERENCES `reserva` (`idreserva`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `idusuarios` int NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `Correo_electronico` varchar(254) NOT NULL,
  `Contraseña` varchar(255) NOT NULL,
  `rol` tinyint NOT NULL,
  `estado` tinyint NOT NULL,
  `fecha_registro` datetime NOT NULL,
  PRIMARY KEY (`idusuarios`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb3;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-14 11:21:07
