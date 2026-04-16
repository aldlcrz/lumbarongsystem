const { exec } = require('child_process');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbUser = process.env.DB_USER || 'root';
const dbHost = process.env.DB_HOST || '127.0.0.1';
const dbName = process.env.DB_NAME || 'lumbarong_db';
const sqlPath = path.resolve(__dirname, '../../lumbarong_cleaned.sql');

// Assuming XAMPP default path for mysql.exe on Windows
const mysqlExec = 'C:\\xampp\\mysql\\bin\\mysql.exe';

console.log(`🚀 Starting import of ${path.basename(sqlPath)} into ${dbName}...`);

// First, create the database if it doesn't exist
const createDbCommand = `"${mysqlExec}" -u ${dbUser} -h ${dbHost} -e "CREATE DATABASE IF NOT EXISTS ${dbName};"`;

exec(createDbCommand, (dbError) => {
    if (dbError) {
        console.error(`❌ Error creating database: ${dbError.message}`);
        console.log('\n💡 Tip: Make sure MySQL is started in XAMPP.');
        return;
    }

    // Now import the SQL file
    const importCommand = `"${mysqlExec}" -u ${dbUser} -h ${dbHost} ${dbName} < "${sqlPath}"`;
    
    exec(importCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error importing database: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`⚠️ Warning during import: ${stderr}`);
        }
        console.log(`✅ Success! Data from ${path.basename(sqlPath)} has been imported into ${dbName}.`);
    });
});
