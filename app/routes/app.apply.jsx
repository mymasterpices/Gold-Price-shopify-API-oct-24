import { Page, Layout, Card, Button, BlockStack, Text } from '@shopify/polaris';
import { TitleBar } from '@shopify/app-bridge-react';
import { Form } from '@remix-run/react';
import { json } from '@remix-run/node';
import { authenticate } from '../shopify.server';


export async function action({ request }) {
    try {
        // Authenticate and retrieve admin details
        const { admin } = await authenticate.admin(request);

        let hasNextPage = true;
        let cursor = null;

        while (hasNextPage) {
            // Run the GraphQL query to fetch products with the 'Gold_22K' tag
            const response = await admin.graphql(`
                query ($cursor: String) {
                    products(first: 200, query: "tag:Gold_22K", after: $cursor) {
                        edges {
                            node {
                                id
                                tags
                                variants(first: 1) {
                                    nodes {
                                        id
                                        title
                                        price
                                    }
                                }
                                metafields(first: 10) {
                                    edges {
                                        node {
                                            key
                                            value
                                        }
                                    }
                                }
                            }
                        }
                        pageInfo {
                            endCursor
                            hasNextPage
                        }
                    }
                }
            `, { cursor });

            const result = await response.json();
            const gold22KProducts = result.data.products.edges;
            hasNextPage = result.data.products.pageInfo.hasNextPage;
            cursor = result.data.products.pageInfo.endCursor;

            if (gold22KProducts.length > 0) {
                console.log(`Found ${gold22KProducts.length} products with the 'Gold_22K' tag:`);

                // Iterate through the products and update their prices
                for (const product of gold22KProducts) {
                    const { id, metafields, variants } = product.node;

                    console.log("Product ID: " + id);

                    // Initialize variables to hold gold_weight and making_charges
                    let goldWeight = null;
                    let makingCharges = null;

                    // Extract gold_weight and making_charges from the product metafields
                    if (metafields && metafields.edges.length > 0) {
                        metafields.edges.forEach(({ node: { key, value } }) => {
                            if (key === 'gold_weight') {
                                goldWeight = parseFloat(value);
                            } else if (key === 'making_charges') {
                                makingCharges = parseFloat(value);
                            }
                        });
                    }

                    // Process variants to get the default variant ID
                    let variantId = variants.nodes.length > 0 ? variants.nodes[0].id : null;

                    // Log the values before proceeding
                    console.log(`Gold Weight: ${goldWeight}, Making Charges: ${makingCharges}, Variant ID: ${variantId}`);

                    // Placeholder for your fetched gold rate. Replace with actual dynamic fetching.
                    const goldRate = 7000;
                    const newPrice = calculatePrice(goldWeight, makingCharges, goldRate);

                    try {
                        // Update the variant price using a GraphQL mutation
                        const updateResponse = await admin.graphql(`#graphql
                                    mutation UpdateProductVariantsPrices($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
                                        productVariantsBulkUpdate(productId: $productId, variants: $variants) {
                                            productVariants {
                                                id
                                                price
                                            }
                                            userErrors {
                                                field
                                                message
                                            }
                                        }
                                    }
                                `, {
                            variables: {
                                productId: id, // Replace with actual product ID as needed
                                variants: [
                                    {
                                        id: variantId, // Replace with actual variant ID as needed
                                        price: newPrice
                                    }
                                ]
                            }
                        });

                        const updateResult = await updateResponse.json();
                        if (updateResult.data && !updateResult.data.productVariantsBulkUpdate.userErrors.length) {
                            console.log(`Updated price for Product ID: ${id}`);
                        } else {
                            console.error(`Error updating Product ID: ${id}`, updateResult.data.productVariantsBulkUpdate.userErrors);
                        }
                    } catch (err) {
                        console.error(`Error updating product ID ${id}:`, err.message);
                    }
                }
            } else {
                console.log("No products found with the tag 'Gold_22K'.");
            }
        }
    } catch (err) {
        console.error('Error during processing:', err.message);
        return json({ error: err.message }, { status: 500 });
    }

    return null;
}

function calculatePrice(goldWeight, makingCharges, goldRate) {
    if (goldWeight && makingCharges) {
        const goldActualPrice = goldRate * goldWeight;
        const goldMakingAmount = (goldActualPrice * makingCharges) / 100;
        const total = goldActualPrice + goldMakingAmount;
        return total.toFixed(2);
    }
    return null;
}

export default function Apply() {
    return (
        <Page>
            <TitleBar title="Update GOLD Price" />
            <BlockStack gap="500">
                <Layout>
                    <Layout.Section>
                        <Card>
                            <BlockStack>
                                <Text variant="headingMd" as="h2">
                                    Set new gold rate for the entire store
                                </Text>
                                <Form method="post">
                                    <p>
                                        Updating the gold product pricing will affect the product rate on the live website.
                                    </p>
                                    <br />
                                    <Button variant="primary" submit>
                                        Update
                                    </Button>
                                </Form>
                            </BlockStack>
                        </Card>
                    </Layout.Section>
                </Layout>
            </BlockStack>
        </Page>
    );
}
