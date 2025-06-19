# IDENDER

## ![image](https://github.com/user-attachments/assets/8c7af029-b9f9-4897-bdb4-e2a1112bad5c)


## Purpose 
Idender is an application designed to engage students of the Tallinn French Lyceum in school decision-making processes. Students have expressed feeling excluded from school governance. To address this issue, Idender provides a platform where students can: submit ideas for improving school life, vote on proposed initiatives, and see the most popular ideas reviewed by the school administration for potential implementation. The goal is to ensure student voices are heard, with the most supported proposals moving toward realization.

## Context
The project was developed as part of the Software Development Project at Tallinn University (TLÜ) during the summer internship in 2025.

## Technologies Used
### Frontend (idender-frontend) https://github.com/nvassiljev-tlu/idender-frontend
- Next.js (15.3.3)
- React (19.1.0)
- React DOM (19.1.0)
- Tailwind CSS (4)
- Axios (1.9.0)
- React Hook Form (7.57.0)
- Zod (3.25.61)
- i18next (25.2.1) with react-i18next (15.5.3), i18next-http-backend (3.0.2) and i18next-browser-languagedetector (8.2.0)
- Lucide React (0.513.0)
- MySQL2 (3.14.1)
- Node.js (20.12.1)

### Backend (idender-api) https://github.com/nvassiljev-tlu/idender-api
- Express (5.1.0)
- Prisma (6.8.2) with @prisma/client (6.8.2)
- Bcrypt (6.0.0)
- Node.js (20.12.1)
- Nodemon (3.1.10)
- Express Rate Limit (7.5.0)
- Body-parser (2.2.0)
- Dotenv (16.5.0)

## Authors
- Nikita Vassiljev
- Aleksandra Gluhhova
- Jonas Oliveira
- Edgar-Adrian Bojev
- Alina Rohozinska
- Ksaveri Petrov

## Installation Instructions
1. Create a server on Ubuntu (v22.04 LTS).
2. Download latest version of nginx PM2 on Ubuntu server.
3. Configure nginx to work on any port.
4. Downnload git.
5. git clone idender-api repo (https://github.com/nvassiljev-tlu/idender-api) and idender-frontend repo (https://github.com/nvassiljev-tlu/idender-frontend).
6. Modify the pm2.config.js - it must include this code: 

        {
            name: "idender-prod",
            script: "./server.js",
            cmd: "/var/www/idender-api-production",
            env: {
                NODE_ENV: "production"
            }
        }

7. Go to /etc/nginx/sites-available/idender.
   
8.   If you have a domain:
   - go to domain register (In Estonia zone.ee) or where your DNS records are stored.
   - go to DNS settings and add: A, host: what you want, target: ubuntu server ip-aadress.
   - download certbot and get certificates.
     
     If you do not have a domain:
   - insert into /etc/nginx/sites-available/idender the following code: server {
    listen 80;                    
    server_name your_domain.com www.your_domain.com;
9. In ubuntu console run pm2 start 0.
10. Download MySQL and phpmyadmin and follow installation: when asked - choose apache2.
11. nginx and apache may conflict with eachother - when the database on phpmyadmin starts running the server on nginx may shut down. Find solution on the web.
12. Insert the following MySQL code info the database:
```sql
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `idender` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `idender_stage`;

CREATE TABLE `categories` (
  `id` int NOT NULL,
  `name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `forgot_password_session` (
  `id` int NOT NULL,
  `email` varchar(400) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expired_at` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_used` tinyint(1) NOT NULL DEFAULT '0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `news` (
  `id` int NOT NULL,
  `title` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `otp_code` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiresAt` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `verified` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `scope` (
  `id` int NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `session` (
  `id` int NOT NULL,
  `sid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `expires` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `data` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `createdAt` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `updatedAt` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `suggestions` (
  `id` int NOT NULL,
  `title` varchar(30) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_anonymus` tinyint(1) NOT NULL,
  `createdAt` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` int NOT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `suggestions_categories` (
  `id` int NOT NULL,
  `suggestion_id` int DEFAULT NULL,
  `category_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `suggestion_comments` (
  `id` int NOT NULL,
  `comment` varchar(250) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `deleted_at` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_id` varchar(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `suggestion_id` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `lang` varchar(10) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'et'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `user_scope` (
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scopeId` int NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `vote` (
  `id` int NOT NULL,
  `ideaId` int NOT NULL,
  `userId` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `reaction` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `forgot_password_session`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `news`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `otp_code`
  ADD PRIMARY KEY (`id`),
  ADD KEY `email` (`email`);

ALTER TABLE `scope`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `name` (`name`);

ALTER TABLE `session`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `sid` (`sid`),
  ADD KEY `userId` (`userId`);

ALTER TABLE `suggestions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

ALTER TABLE `suggestions_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `suggestion_id` (`suggestion_id`),
  ADD KEY `category_id` (`category_id`);

ALTER TABLE `suggestion_comments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`),
  ADD KEY `suggestion_id` (`suggestion_id`);

ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

ALTER TABLE `user_scope`
  ADD PRIMARY KEY (`userId`,`scopeId`),
  ADD KEY `scopeId` (`scopeId`);

ALTER TABLE `vote`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `uniq_vote` (`ideaId`,`userId`),
  ADD KEY `vote_ibfk_1` (`userId`);


ALTER TABLE `categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `forgot_password_session`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `news`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `scope`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `session`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `suggestions`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `suggestions_categories`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `suggestion_comments`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;

ALTER TABLE `vote`
  MODIFY `id` int NOT NULL AUTO_INCREMENT;


ALTER TABLE `news`
  ADD CONSTRAINT `news_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `session`
  ADD CONSTRAINT `session_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`);

ALTER TABLE `suggestions`
  ADD CONSTRAINT `suggestions_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`);

ALTER TABLE `suggestions_categories`
  ADD CONSTRAINT `suggestions_categories_ibfk_1` FOREIGN KEY (`suggestion_id`) REFERENCES `suggestions` (`id`),
  ADD CONSTRAINT `suggestions_categories_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`);

ALTER TABLE `suggestion_comments`
  ADD CONSTRAINT `suggestion_comments_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `suggestion_comments_ibfk_2` FOREIGN KEY (`suggestion_id`) REFERENCES `suggestions` (`id`);

ALTER TABLE `user_scope`
  ADD CONSTRAINT `user_scope_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `user_scope_ibfk_2` FOREIGN KEY (`scopeId`) REFERENCES `scope` (`id`);

ALTER TABLE `vote`
  ADD CONSTRAINT `vote_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `vote_ibfk_2` FOREIGN KEY (`ideaId`) REFERENCES `suggestions` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
```
13. In the directory where the idender-api is stored you need to create .env.production file and put the following into it:
    ```
    NODE_ENV=production
    PORT= *your choose the port*
    DATABASE_USERNAME= *username*
    DATABASE_HOST=*server ip-aadress*
    DATABASE_PASSWORD=*password*
    ```
15. Go to MySQL thru console and create database user, grant him privileges.
16. Sign up to Vercel and connect your github.
17. Choose the idender-frontend repo and connect it.
18. In the front-end section of the code change all ip-aadresses to your domain or your server ip-aadress.
19. DONE.



## License 
The project is licensed under the MIT License. See the LICENSE file.
