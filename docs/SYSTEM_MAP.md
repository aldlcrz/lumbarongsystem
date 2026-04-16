# 🗺️ Lumbarong System Map

This document explains how the **Lumbarong** system works using simple analogies.

---

## 🏗️ The Three Pillars
Think of the system like a **Fine Dining Restaurant**.

### 1. 🍳 The Kitchen (Backend)
- **Location**: `/backend`
- **What it does**: This is where all the "cooking" happens. It handles calculations, checks security, manages orders, and speaks to the database.
- **Key Concepts**:
  - `controllers/`: The **Chefs** who decide how to prepare each request.
  - `routes/`: The **Waiters** who take orders from the storefront and bring them to the kitchen.
  - `models/`: The **Recipes** that define what a "Product" or an "Order" looks like.

### 2. 🏪 The Storefront (Frontend & Mobile)
- **Location**: `/frontend` and `/flutter_app`
- **What it does**: This is what the customers and sellers see. It's the beautiful menus, the buttons, and the shopping carts.
- **Key Concepts**:
  - `src/app/`: The different **Rooms** in the store (Shop, Checkout, Profile).
  - `src/components/`: The **Furniture** and UI elements (Buttons, Headers, Cards).

### 3. 🥫 The Pantry (Database)
- **Location**: MySQL Database (managed via XAMPP)
- **What it does**: This is where all the ingredients (data) are stored safely long-term. Even if you turn off the kitchen, the ingredients stay in the pantry.

---

## 📁 Where is everything else?

| Folder | What’s inside? |
| :--- | :--- |
| `backups/` | Safety copies of your data (SQL files). |
| `docs/` | Instruction manuals and walkthroughs for the system. |
| `uploads/` | Photos of products and payment receipts. |
| `backend/logs/` | Note-books where the system writes down errors or activity for debugging. |

---

## 🔄 How an Order Happens
1. **Selection**: A customer taps a button in the **Storefront** (Frontend).
2. **Order**: The **Waiters** (Routes) take that order to the **Kitchen** (Backend).
3. **Check**: The **Chefs** (Controllers) check the **Pantry** (Database) to see if there is enough stock.
4. **Action**: If everything is okay, the Chef writes down the new Order in the Pantry and notifies the Seller.
5. **Confirmation**: You see the "New Order" alert on your screen!
