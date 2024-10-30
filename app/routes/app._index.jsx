import {
  Page,
  Layout,
  BlockStack, EmptyState
} from "@shopify/polaris";
import { TitleBar, useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  await authenticate.admin(request);
  return null;
};

export const action = async ({ request }) => {
  return null;
};

export default function Index() {
  return (
    <Page>
      <TitleBar title="Overview">
        {/* <button variant="primary" onClick={generateProduct}>
          Generate a product
        </button> */}
      </TitleBar>
      <BlockStack gap="500">
        <Layout>
          <EmptyState
            heading="Gold Product Pricing System"
            action={{
              content: 'Configure Gold Price',
              url: './settings'
            }}
            url="/price"
            // secondaryAction={{
            //   content: 'Learn more',
            //   url: 'https://help.shopify.com',
            // }}
            image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
          >
            <p>Configure The Gold Rate And Gst Rate For Your Gold Products Within The Shopify Store.</p>
          </EmptyState>
        </Layout>
      </BlockStack>
    </Page>
  );


}
