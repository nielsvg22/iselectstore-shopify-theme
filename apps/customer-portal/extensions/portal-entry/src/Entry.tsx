import '@shopify/ui-extensions/preact';
import {render} from 'preact';

// Static targets make the full-page portal discoverable without a merchant
// having to copy a generated page URL. Shopify resolves the sibling handle
// within this installed app and owns authentication/navigation.
export default async () => {
  render(
    <s-banner heading="Alles voor jouw iSelectStore-aankoop">
      <s-stack gap="base">
        <s-paragraph>Je bestellingen, producten, garantiegegevens en ondersteuning op één plek.</s-paragraph>
        <s-button href="extension:iselectstore-portal/" variant="primary">Open mijn iSelectStore</s-button>
      </s-stack>
    </s-banner>,
    document.body,
  );
};
