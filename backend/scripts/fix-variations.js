const sequelize = require('../src/config/database');
const { Product } = require('../src/models/Product');
const { QueryTypes } = require('sequelize');

async function fixVariations() {
    try {
        await sequelize.authenticate();
        console.log('Database connected.');

        // 1. Fix existing products with NULL variations or stringified JSON
        const products = await Product.findAll();
        console.log(`Found ${products.length} products.`);

        for (const product of products) {
            let updated = false;
            let colors = product.availableColors;
            let designs = product.availableDesigns;

            // Handle colors
            if (colors === null || colors === undefined || colors === '') {
                colors = [];
                updated = true;
            } else if (typeof colors === 'string') {
                try {
                    colors = JSON.parse(colors);
                    if (!Array.isArray(colors)) colors = [colors];
                    updated = true;
                } catch (e) {
                    colors = [colors];
                    updated = true;
                }
            }

            // Handle designs
            if (designs === null || designs === undefined || designs === '') {
                designs = [];
                updated = true;
            } else if (typeof designs === 'string') {
                try {
                    designs = JSON.parse(designs);
                    if (!Array.isArray(designs)) designs = [designs];
                    updated = true;
                } catch (e) {
                    designs = [designs];
                    updated = true;
                }
            }

            if (updated) {
                console.log(`Updating product: ${product.name} (ID: ${product.id})`);
                await product.update({
                    availableColors: colors,
                    availableDesigns: designs
                });
            }
        }

        console.log('Finished fixing products.');
        process.exit(0);
    } catch (error) {
        console.error('Fix failed:', error);
        process.exit(1);
    }
}

fixVariations();
