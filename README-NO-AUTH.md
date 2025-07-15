# VsdvBillsoft - No Authentication Mode

This document explains how to use VsdvBillsoft without authentication requirements.

## Overview

We've modified the application to remove authentication requirements for warehouse management and other operations. This makes it easier to use in a development or single-user environment.

## Changes Made

1. Created a new SQL file `schema-remove-auth.sql` that:
   - Drops all existing Row Level Security (RLS) policies that required authentication
   - Creates new policies that allow access to anyone
   - Makes all user-related columns optional

2. Modified the client code to:
   - Remove authentication checks from utility functions
   - Provide dummy user IDs where required
   - Skip token refresh mechanisms

## How to Apply the Changes

### Database Changes

1. Connect to your Supabase database using the SQL Editor
2. Run the contents of `schema-remove-auth.sql` to update the RLS policies

```sql
-- Example of how to run it in Supabase SQL Editor
BEGIN;
  -- Copy and paste the contents of schema-remove-auth.sql here
COMMIT;
```

### Client Application

The client-side changes have already been applied to the codebase. These include:

- Modified `warehouseUtils.js` to not require authentication for transfers
- Updated `apiUtils.js` to provide a dummy token
- Updated `notificationUtils.js` to work without authentication

## New Features Added

In addition to removing authentication requirements, we've added the following features:

1. **Service Management System**
   - Full service record tracking
   - Warranty management
   - Service status updates
   - Repair/service cost tracking
   - Integration with product inventory

2. **Billing System**
   - Invoice generation
   - Customer management
   - Print/download invoices
   - Warranty recording
   - Item serial number tracking

## Using the New Features

### Service Management

- Access via the "Service" link in the navigation menu
- Create service records for both warranty and non-warranty repairs
- Track service status from receipt to delivery
- Search and filter service records by various criteria
- Link service records to original purchases

### Billing

- Access via the "Billing" link in the navigation menu
- Create invoices for customers
- Add line items with product, quantity, price, and warranty information
- Record serial numbers for warranty tracking
- Print or download PDF invoices
- Search and filter invoices by various criteria

## Notes

- This configuration is intended for development, testing, or single-user deployments
- If you need to re-enable authentication later, you can create new RLS policies that require authentication