-- Database Schema for Billing App

-- Users Table
CREATE TABLE IF NOT EXISTS "Users" (
    "Id" SERIAL PRIMARY KEY,
    "Username" VARCHAR(50) NOT NULL UNIQUE,
    "PasswordHash" VARCHAR(255) NOT NULL,
    "ShopName" VARCHAR(100) NOT NULL,
    "Address" TEXT,
    "GSTIN" VARCHAR(20),
    "LogoUrl" TEXT,
    "GstRates" VARCHAR(100) DEFAULT '0,5,12,18,28',
    "CreatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers Table
CREATE TABLE IF NOT EXISTS "Customers" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Mobile" VARCHAR(15) NOT NULL,
    "Address" TEXT,
    "ShopOwnerId" INT REFERENCES "Users"("Id"),
    CONSTRAINT "Unique_Customer_Mobile_Shop" UNIQUE ("Mobile", "ShopOwnerId")
);

-- Items Table
CREATE TABLE IF NOT EXISTS "Items" (
    "Id" SERIAL PRIMARY KEY,
    "Name" VARCHAR(100) NOT NULL,
    "Price" DECIMAL(18,2) NOT NULL,
    "Category" VARCHAR(50),
    "HSNCode" VARCHAR(20),
    "GSTRate" DECIMAL(5,2) DEFAULT 0,
    "ShopOwnerId" INT REFERENCES "Users"("Id")
);

-- Bills Table
CREATE TABLE IF NOT EXISTS "Bills" (
    "Id" SERIAL PRIMARY KEY,
    "BillNumber" VARCHAR(20) NOT NULL UNIQUE,
    "Date" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "CustomerId" INT REFERENCES "Customers"("Id"),
    "SubTotal" DECIMAL(18,2) NOT NULL,
    "Discount" DECIMAL(18,2) DEFAULT 0,
    "TotalCGST" DECIMAL(18,2) DEFAULT 0,
    "TotalSGST" DECIMAL(18,2) DEFAULT 0,
    "TotalIGST" DECIMAL(18,2) DEFAULT 0,
    "TotalAmount" DECIMAL(18,2) NOT NULL,
    "ShopOwnerId" INT REFERENCES "Users"("Id")
);

-- BillItems Table
CREATE TABLE IF NOT EXISTS "BillItems" (
    "Id" SERIAL PRIMARY KEY,
    "BillId" INT REFERENCES "Bills"("Id") ON DELETE CASCADE,
    "ItemId" INT REFERENCES "Items"("Id"),
    "ItemName" VARCHAR(100) NOT NULL,
    "Price" DECIMAL(18,2) NOT NULL,
    "Quantity" INT NOT NULL,
    "Discount" DECIMAL(18,2) DEFAULT 0,
    "HSNCode" VARCHAR(20),
    "CGST" DECIMAL(18,2) DEFAULT 0,
    "SGST" DECIMAL(18,2) DEFAULT 0,
    "IGST" DECIMAL(18,2) DEFAULT 0,
    "Total" DECIMAL(18,2) NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS "IX_Customers_Mobile" ON "Customers"("Mobile");
CREATE INDEX IF NOT EXISTS "IX_Bills_Date" ON "Bills"("Date");

-- Migrations (Idempotent)
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "Address" TEXT;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "GSTIN" VARCHAR(20);
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "LogoUrl" TEXT;
ALTER TABLE "Items" ADD COLUMN IF NOT EXISTS "HSNCode" VARCHAR(20);
ALTER TABLE "Items" ADD COLUMN IF NOT EXISTS "GSTRate" DECIMAL(5,2) DEFAULT 0;
ALTER TABLE "Users" ADD COLUMN IF NOT EXISTS "GstRates" VARCHAR(100) DEFAULT '0,5,12,18,28';

ALTER TABLE "Bills" ADD COLUMN IF NOT EXISTS "Discount" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Bills" ADD COLUMN IF NOT EXISTS "TotalCGST" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Bills" ADD COLUMN IF NOT EXISTS "TotalSGST" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "Bills" ADD COLUMN IF NOT EXISTS "TotalIGST" DECIMAL(18,2) DEFAULT 0;

ALTER TABLE "BillItems" ADD COLUMN IF NOT EXISTS "Discount" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "BillItems" ADD COLUMN IF NOT EXISTS "HSNCode" VARCHAR(20);
ALTER TABLE "BillItems" ADD COLUMN IF NOT EXISTS "CGST" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "BillItems" ADD COLUMN IF NOT EXISTS "SGST" DECIMAL(18,2) DEFAULT 0;
ALTER TABLE "BillItems" ADD COLUMN IF NOT EXISTS "IGST" DECIMAL(18,2) DEFAULT 0;

-- Seed Data (Refined with Realistic Indian Context)
INSERT INTO "Users" ("Username", "PasswordHash", "ShopName", "Address", "GSTIN")
VALUES ('admin', 'admin123', 'ELECTRA ELECTRONICS', 'Shop No. 42, Nehru Place Commercial Complex, New Delhi - 110019', '07AAAAA0000A1Z5')
ON CONFLICT ("Username") 
DO UPDATE SET 
    "PasswordHash" = EXCLUDED."PasswordHash",
    "ShopName" = EXCLUDED."ShopName",
    "Address" = EXCLUDED."Address",
    "GSTIN" = EXCLUDED."GSTIN";

-- Seed Customers
INSERT INTO "Customers" ("Name", "Mobile", "Address", "ShopOwnerId")
SELECT 'Rajesh Kumar', '9812345678', 'Flat 202, Sunshine Apartments, Noida Sector 62', "Id" FROM "Users" WHERE "Username" = 'admin'
ON CONFLICT ("Mobile", "ShopOwnerId") DO NOTHING;

INSERT INTO "Customers" ("Name", "Mobile", "Address", "ShopOwnerId")
SELECT 'Amit Sharma', '9988776655', 'House No. 12, MG Road, Gurgaon', "Id" FROM "Users" WHERE "Username" = 'admin'
ON CONFLICT ("Mobile", "ShopOwnerId") DO NOTHING;

INSERT INTO "Customers" ("Name", "Mobile", "Address", "ShopOwnerId")
SELECT 'Sonal Singh', '9555444333', 'Sector 15, Dwarka, Delhi', "Id" FROM "Users" WHERE "Username" = 'admin'
ON CONFLICT ("Mobile", "ShopOwnerId") DO NOTHING;

-- Seed Items
INSERT INTO "Items" ("Name", "Price", "Category", "HSNCode", "GSTRate", "ShopOwnerId")
SELECT 'Smart LED TV 43"', 24500.00, 'Electronics', '8528', 18, "Id" FROM "Users" WHERE "Username" = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO "Items" ("Name", "Price", "Category", "HSNCode", "GSTRate", "ShopOwnerId")
SELECT 'Wireless Mouse', 850.00, 'Accessories', '8471', 12, "Id" FROM "Users" WHERE "Username" = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO "Items" ("Name", "Price", "Category", "HSNCode", "GSTRate", "ShopOwnerId")
SELECT 'USB-C Charging Cable', 450.00, 'Accessories', '8544', 18, "Id" FROM "Users" WHERE "Username" = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO "Items" ("Name", "Price", "Category", "HSNCode", "GSTRate", "ShopOwnerId")
SELECT 'Bluetooth Earbuds', 1999.00, 'Electronics', '8518', 18, "Id" FROM "Users" WHERE "Username" = 'admin'
ON CONFLICT DO NOTHING;

-- Seed Initial Invoices
DO $$
DECLARE 
    v_UserId INT;
    v_Cust1 INT;
    v_Cust2 INT;
    v_Item1 INT;
    v_Item2 INT;
    v_BillId INT;
BEGIN
    SELECT "Id" INTO v_UserId FROM "Users" WHERE "Username" = 'admin';
    SELECT "Id" INTO v_Cust1 FROM "Customers" WHERE "Mobile" = '9812345678' AND "ShopOwnerId" = v_UserId;
    SELECT "Id" INTO v_Cust2 FROM "Customers" WHERE "Mobile" = '9988776655' AND "ShopOwnerId" = v_UserId;
    SELECT "Id" INTO v_Item1 FROM "Items" WHERE "Name" LIKE 'Smart LED TV%' AND "ShopOwnerId" = v_UserId;
    SELECT "Id" INTO v_Item2 FROM "Items" WHERE "Name" = 'Wireless Mouse' AND "ShopOwnerId" = v_UserId;

    -- Bill 1
    INSERT INTO "Bills" ("BillNumber", "Date", "CustomerId", "SubTotal", "Discount", "TotalCGST", "TotalSGST", "TotalIGST", "TotalAmount", "ShopOwnerId")
    VALUES ('INV-2024-0001', NOW() - INTERVAL '2 days', v_Cust1, 24500.00, 500, 2160, 2160, 0, 28320.00, v_UserId)
    ON CONFLICT ("BillNumber") DO NOTHING
    RETURNING "Id" INTO v_BillId;

    IF v_BillId IS NOT NULL THEN
        INSERT INTO "BillItems" ("BillId", "ItemId", "ItemName", "Price", "Quantity", "Discount", "HSNCode", "CGST", "SGST", "IGST", "Total")
        VALUES (v_BillId, v_Item1, 'Smart LED TV 43"', 24500.00, 1, 500, '8528', 2160, 2160, 0, 28320.00);
    END IF;

    -- Bill 2
    INSERT INTO "Bills" ("BillNumber", "Date", "CustomerId", "SubTotal", "Discount", "TotalCGST", "TotalSGST", "TotalIGST", "TotalAmount", "ShopOwnerId")
    VALUES ('INV-2024-0002', NOW() - INTERVAL '1 hour', v_Cust2, 1700.00, 0, 102, 102, 0, 1904.00, v_UserId)
    ON CONFLICT ("BillNumber") DO NOTHING
    RETURNING "Id" INTO v_BillId;

    IF v_BillId IS NOT NULL THEN
        INSERT INTO "BillItems" ("BillId", "ItemId", "ItemName", "Price", "Quantity", "Discount", "HSNCode", "CGST", "SGST", "IGST", "Total")
        VALUES (v_BillId, v_Item2, 'Wireless Mouse', 850.00, 2, 0, '8471', 102, 102, 0, 1904.00);
    END IF;
END $$;
