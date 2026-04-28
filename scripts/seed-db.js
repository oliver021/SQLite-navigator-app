import Database from 'better-sqlite3';
import { faker } from '@faker-js/faker';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../sample-bloated.sqlite');

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
}

const db = new Database(dbPath);

console.log('Creating bloated database...');

// Create tables
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    avatar TEXT,
    job_title TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_name TEXT NOT NULL,
    department TEXT NOT NULL,
    price REAL NOT NULL,
    stock INTEGER NOT NULL,
    description TEXT
  );

  CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT NOT NULL,
    order_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

console.log('Tables created. Inserting users...');

const insertUser = db.prepare(`
  INSERT INTO users (first_name, last_name, email, avatar, job_title) 
  VALUES (?, ?, ?, ?, ?)
`);

const insertProduct = db.prepare(`
  INSERT INTO products (product_name, department, price, stock, description) 
  VALUES (?, ?, ?, ?, ?)
`);

const insertOrder = db.prepare(`
  INSERT INTO orders (user_id, total_amount, status, order_date) 
  VALUES (?, ?, ?, ?)
`);

db.transaction(() => {
  // 10,000 users
  for (let i = 1; i <= 10000; i++) {
    insertUser.run(
      faker.person.firstName(),
      faker.person.lastName(),
      faker.internet.email() + i, // ensure unique
      faker.image.avatar(),
      faker.person.jobTitle()
    );
  }
})();
console.log('Users inserted. Inserting products...');

db.transaction(() => {
  // 5,000 products
  for (let i = 1; i <= 5000; i++) {
    insertProduct.run(
      faker.commerce.productName(),
      faker.commerce.department(),
      parseFloat(faker.commerce.price()),
      faker.number.int({ min: 0, max: 1000 }),
      faker.commerce.productDescription()
    );
  }
})();
console.log('Products inserted. Inserting orders...');

db.transaction(() => {
  // 50,000 orders
  for (let i = 1; i <= 50000; i++) {
    insertOrder.run(
      faker.number.int({ min: 1, max: 10000 }),
      parseFloat(faker.commerce.price({ min: 10, max: 2000 })),
      faker.helpers.arrayElement(['PENDING', 'SHIPPED', 'DELIVERED', 'CANCELLED']),
      faker.date.past({ years: 2 }).toISOString()
    );
  }
})();

console.log(`\nSuccessfully created bloated database at: ${dbPath}`);
console.log('Stats:');
console.log('- 10,000 Users');
console.log('- 5,000 Products');
console.log('- 50,000 Orders');

db.close();
