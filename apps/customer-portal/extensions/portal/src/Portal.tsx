import '@shopify/ui-extensions/preact';
import {createContext, render, type ComponentChildren} from 'preact';
import {useCallback, useContext, useEffect, useRef, useState} from 'preact/hooks';
import {useApi, useSettings, useSubscription} from '@shopify/ui-extensions/customer-account/preact';
import {ACCOUNT_QUERY, WARRANTY_QUERY, WISHLIST_QUERY, WISHLIST_MUTATION,
  PRODUCTS_QUERY, SEARCH_QUERY, accountQuery, httpsUrl, money, date, tracking,
  financialLabels, fulfillmentLabels, warrantyFor, wishlistIds, wishlistInput, productSearch,
  supportDestination, serviceLink} from './api.mjs';
import type {Customer, Order, Line, Product, Shop} from './types';

export default async () => { render(<Portal />, document.body); };

const routes = [
  ['overview', 'Overzicht'], ['orders', 'Mijn bestellingen'],
  ['products', 'Producten & garantie'], ['profile', 'Mijn gegevens'],
  ['support', 'Service & retouren'],
] as const;
type Route = typeof routes[number][0] | 'favorites';
type Settings = {storefront_url: string; support_url: string; faq_url: string; warranty_url: string; wishlist_enabled: boolean};
type PageInfo = {hasNextPage: boolean; endCursor: string | null};
const ShopContext = createContext<Shop | null>(null);

function Card({heading, children}: {heading?: string; children: ComponentChildren}) {
  return <s-box padding="large" border="base" borderRadius="large" background="base">
    <s-stack gap="base">{heading && <s-heading>{heading}</s-heading>}{children}</s-stack>
  </s-box>;
}
function Empty({heading, children}: {heading: string; children: ComponentChildren}) {
  const settings = useSettings<Settings>();
  const shop = useContext(ShopContext);
  const storefrontUrl = httpsUrl(settings.storefront_url) || httpsUrl(shop?.url);
  return <Card heading={heading}><s-paragraph color="subdued">{children}</s-paragraph>
    {storefrontUrl && <s-link href={storefrontUrl}>Ontdek onze voorraad</s-link>}</Card>;
}
function ErrorNotice({retry, access = false}: {retry: () => void; access?: boolean}) {
  return <s-banner tone="critical" heading={access ? 'Je gegevens zijn niet beschikbaar' : 'Ophalen is niet gelukt'}>
    <s-stack gap="base"><s-paragraph>{access
      ? 'Open je Shopify-account opnieuw. Blijft dit gebeuren? Neem dan contact met ons op.'
      : 'Controleer je verbinding en probeer het opnieuw. Je kunt je bestellingen ook rechtstreeks bij Shopify openen.'}</s-paragraph>
      <s-stack direction="inline" gap="base"><s-button onClick={retry}>Opnieuw proberen</s-button>
        <s-link href="shopify:customer-account/orders">Naar Shopify-bestellingen</s-link></s-stack>
    </s-stack></s-banner>;
}
function Loading() {
  return <s-stack gap="base" accessibilityRole="status">
    <s-spinner accessibilityLabel="Je gegevens worden opgehaald" />
    <s-text color="subdued">Een moment, we halen je gegevens veilig op.</s-text>
    <s-skeleton-paragraph /><s-skeleton-paragraph />
  </s-stack>;
}
function OrderBadges({order}: {order: Order}) {
  return <s-stack direction="inline" gap="small">
    {order.cancelledAt && <s-badge tone="critical">Geannuleerd</s-badge>}
    <s-badge>{financialLabels[order.financialStatus as keyof typeof financialLabels] || 'Betaalstatus niet beschikbaar'}</s-badge>
    <s-badge>{fulfillmentLabels[order.fulfillmentStatus as keyof typeof fulfillmentLabels] || 'Verzendstatus niet beschikbaar'}</s-badge>
  </s-stack>;
}
function LineItem({line}: {line: Line}) {
  const source = httpsUrl(line.image?.url);
  return <s-grid gridTemplateColumns="auto minmax(0, 1fr)" gap="base" alignItems="center">
    <s-product-thumbnail src={source} alt={line.image?.altText || line.name} />
    <s-stack gap="small-200"><s-text type="strong">{line.name || line.title}</s-text>
      {line.variantTitle && line.variantTitle !== 'Default Title' && <s-text color="subdued">{line.variantTitle}</s-text>}
      <s-text color="subdued">Aantal: {line.quantity}</s-text>
    </s-stack>
  </s-grid>;
}
function OrderCard({order, compact = false}: {order: Order; compact?: boolean}) {
  const trackingLinks = tracking(order);
  const detailUrl = httpsUrl(order.statusPageUrl);
  return <Card>
    <s-grid gridTemplateColumns="@container (inline-size > 480px) minmax(0, 1fr) auto, minmax(0, 1fr)" gap="small">
      <s-stack gap="small-200"><s-heading>Bestelling {order.name}</s-heading><s-text color="subdued">{date(order.createdAt)}</s-text></s-stack>
      <s-stack gap="small-200"><s-text type="strong">{money(order.totalPrice)}</s-text><s-text color="subdued">Besteltotaal</s-text></s-stack>
    </s-grid>
    <OrderBadges order={order} />
    {Number(order.totalRefunded.amount) > 0 && <s-text color="subdued">Terugbetaald: {money(order.totalRefunded)}</s-text>}
    <s-divider />
    {(compact ? order.lineItems.nodes.slice(0, 1) : order.lineItems.nodes).map(line => <LineItem key={line.id} line={line} />)}
    {((compact && order.lineItems.nodes.length > 1) || order.lineItems.pageInfo.hasNextPage) &&
      <s-text color="subdued">Bekijk de volledige bestelling voor alle artikelen.</s-text>}
    <s-stack direction="inline" gap="base">
      {detailUrl && <s-button href={detailUrl} accessibilityLabel={`Bekijk bestelling ${order.name}`}>Bestelling bekijken</s-button>}
      {trackingLinks.map((item: {url: string; company: string | null}, i: number) => <s-link key={`${item.url}-${i}`} href={httpsUrl(item.url)} target="_blank">
        Track &amp; Trace{item.company ? ` · ${item.company}` : ''}{trackingLinks.length > 1 ? ` (${i + 1})` : ''}
      </s-link>)}
    </s-stack>
    {order.fulfillments.pageInfo.hasNextPage && <s-text color="subdued">Alle zendingen vind je in de volledige bestelling.</s-text>}
  </Card>;
}

function Portal() {
  const api = useApi<'customer-account.page.render'>();
  const identity = useSubscription(api.authenticatedAccount.customer);
  if (!identity?.id) return <s-page heading="Mijn iSelectStore"><s-banner heading="Open je Shopify-account">
    <s-paragraph>Je accountgegevens zijn nog niet beschikbaar. Log in via Shopify of neem contact met ons op als dit blijft gebeuren.</s-paragraph>
    <s-link href="shopify:customer-account/">Naar mijn account</s-link>
  </s-banner></s-page>;
  // Identity changes remount every private subtree, aborting reads and dropping
  // all in-memory orders, warranty data and wishlist state before a new load.
  return <AccountPortal key={identity.id} customerId={identity.id} />;
}

function AccountPortal({customerId}: {customerId: string}) {
  const settings = useSettings<Settings>();
  const [route, setRoute] = useState<Route>('overview');
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [shop, setShop] = useState<Shop | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [pageInfo, setPageInfo] = useState<PageInfo>({hasNextPage: false, endCursor: null});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pending = useRef(false);
  const active = useRef<AbortController | null>(null);
  const owner = useRef<string | null>(null);

  const load = useCallback(async (after: string | null = null) => {
    if (pending.current) return;
    pending.current = true;
    const controller = new AbortController();
    active.current = controller;
    setLoading(true); setError(null);
    try {
      const result = await accountQuery(ACCOUNT_QUERY, {after}, {signal: controller.signal});
      if (controller.signal.aborted) return;
      if (!result.customer || result.customer.id !== customerId || (after && owner.current !== result.customer.id)) throw new Error('access');
      owner.current = result.customer.id;
      setCustomer(result.customer);
      setShop(result.shop || null);
      const next: Order[] = result.customer.orders.nodes;
      setOrders(previous => after ? [...previous, ...next.filter(o => !previous.some(p => p.id === o.id))] : next);
      setPageInfo(result.customer.orders.pageInfo);
    } catch (cause) {
      if (controller.signal.aborted) return;
      const code = cause instanceof Error ? cause.message : 'network';
      setError(code);
      // Retain a same-account list only on transient pagination errors.
      if (!after || code === 'access') {setCustomer(null); setOrders([]); owner.current = null;}
    } finally {
      pending.current = false;
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    void load();
    return () => {active.current?.abort(); owner.current = null;};
  }, [load]);
  useEffect(() => {
    const update = () => {
      const url = navigation.currentEntry.url || '';
      const match = [...routes.map(r => r[0]), 'favorites'].find(r => new RegExp(`(?:/|:)${r}/?(?:[?#].*)?$`).test(url));
      setRoute((match || 'overview') as Route);
    };
    update();
    navigation.addEventListener('currententrychange', update);
    return () => navigation.removeEventListener('currententrychange', update);
  }, [navigation]);
  const navigate = (next: string) => navigation.navigate(`extension://${next}`);
  const items: readonly (readonly [string, string])[] = settings.wishlist_enabled
    ? [...routes, ['favorites', 'Favorieten']] : routes;
  const supportUrl = supportDestination(settings.support_url, shop?.email);
  const storefrontUrl = httpsUrl(settings.storefront_url) || httpsUrl(shop?.url);
  const heading = items.find(([key]) => key === route)?.[1] || 'Mijn iSelectStore';

  return <ShopContext.Provider value={shop}><s-page heading={route === 'overview' ? `Welkom${customer?.firstName ? `, ${customer.firstName}` : ''}` : heading}
    subheading="Mijn iSelectStore · Alles voor jouw aankoop, op één plek.">
    {storefrontUrl && <s-button slot="secondary-actions" href={storefrontUrl}>Verder winkelen</s-button>}
    <s-query-container>
      <s-grid gridTemplateColumns="@container (inline-size > 850px) 220px minmax(0, 1fr), minmax(0, 1fr)" gap="large">
        <s-box padding="base" background="subdued" borderRadius="large">
          <s-stack gap="base">
            <s-box display="@container (inline-size > 850px) none, auto"><s-select label="Ga naar" value={route} onChange={event => navigate((event.currentTarget as HTMLElementTagNameMap['s-select']).value || 'overview')}>
              {items.map(([key, label]) => <s-option key={key} value={key}>{label}</s-option>)}
            </s-select></s-box>
            <s-box display="@container (inline-size > 850px) auto, none"><s-stack gap="small">
              {items.map(([key, label]) => <s-button key={key} inlineSize="fill"
                variant={route === key ? 'primary' : 'secondary'}
                accessibilityLabel={`${label}${route === key ? ', huidige pagina' : ''}`}
                onClick={() => navigate(key)}>{label}</s-button>)}
            </s-stack></s-box>
            <s-text color="subdued">Veilig in je Shopify-account.</s-text>
          </s-stack>
        </s-box>
        <s-stack gap="large">
          {error && <ErrorNotice access={error === 'access'} retry={() => void load(customer ? pageInfo.endCursor : null)} />}
          {loading && !customer && <Loading />}
          {customer && <>
            {route === 'overview' && <>
              <Card heading="Fijn dat je er bent.">
                <s-paragraph color="subdued">Volg je bestelling, bekijk je producten of regel je gegevens. We helpen je graag als je ergens niet uitkomt.</s-paragraph>
                <s-grid gridTemplateColumns="@container (inline-size > 500px) 1fr 1fr, 1fr" gap="base">
                  <s-button onClick={() => navigate('orders')}>Mijn bestellingen</s-button>
                  <s-button onClick={() => navigate('support')}>Hulp bij mijn aankoop</s-button>
                </s-grid>
              </Card>
              <s-heading>Je laatste bestelling</s-heading>
              {orders[0] ? <OrderCard order={orders[0]} compact /> : <Empty heading="Hier begint jouw overzicht">
                Je hebt nog geen bestellingen in dit account. Na je eerste aankoop vind je ze hier terug.
              </Empty>}
              <s-grid gridTemplateColumns="@container (inline-size > 550px) 1fr 1fr, 1fr" gap="base">
                <Card heading="Jouw producten"><s-paragraph color="subdued">Je aankopen en beschikbare garantiegegevens bij elkaar.</s-paragraph>
                  <s-link href="extension://products">Naar producten &amp; garantie</s-link></Card>
                <Card heading="Persoonlijk geregeld"><s-paragraph color="subdued">Beheer je contactgegevens en bezorgadressen veilig via Shopify.</s-paragraph>
                  <s-link href="shopify:customer-account/profile">Gegevens beheren</s-link></Card>
              </s-grid>
            </>}
            {route === 'orders' && <>
              <s-paragraph color="subdued">Van aankoop tot bezorging. Open een bestelling voor je volledige bestelgegevens, zendingen en beschikbare retouropties.</s-paragraph>
              {orders.length ? orders.map(order => <OrderCard key={order.id} order={order} />) :
                <Empty heading="Nog geen bestellingen">Bestel je met het e-mailadres van dit account? Dan verschijnt je aankoop hier.</Empty>}
            </>}
            {route === 'products' && <Products key={customer.id} orders={orders} supportUrl={supportUrl} warrantyUrl={httpsUrl(settings.warranty_url)} />}
            {route === 'profile' && <Profile customer={customer} />}
            {route === 'support' && <Support orders={orders} supportUrl={supportUrl} faqUrl={httpsUrl(settings.faq_url)} warrantyUrl={httpsUrl(settings.warranty_url)} />}
            {route === 'favorites' && settings.wishlist_enabled && <Favorites key={customer.id} customerId={customer.id} />}
            {(route === 'orders' || route === 'products') && pageInfo.hasNextPage && <s-button loading={loading}
              onClick={() => void load(pageInfo.endCursor)}>Meer bestellingen laden</s-button>}
          </>}
          {!loading && !customer && <s-link href="shopify:customer-account/profile">Open mijn Shopify-account</s-link>}
        </s-stack>
      </s-grid>
    </s-query-container>
  </s-page></ShopContext.Provider>;
}

function Profile({customer}: {customer: Customer}) {
  return <s-stack gap="large">
    <Card heading="Persoonlijke gegevens">
      <s-text type="strong">{[customer.firstName, customer.lastName].filter(Boolean).join(' ') || 'Naam nog niet ingevuld'}</s-text>
      <s-text>{customer.emailAddress?.emailAddress || 'E-mailadres niet beschikbaar'}</s-text>
      <s-text>{customer.phoneNumber?.phoneNumber || 'Telefoonnummer nog niet ingevuld'}</s-text>
      <s-button href="shopify:customer-account/profile">Gegevens wijzigen</s-button>
      <s-paragraph color="subdued">Shopify beheert je profiel en controleert wijzigingen waar nodig. Welke velden je kunt wijzigen, hangt af van je accountinstellingen.</s-paragraph>
    </Card>
    <Card heading="Standaardbezorgadres">
      {customer.defaultAddress ? customer.defaultAddress.formatted.map((line, i) => <s-text key={i}>{line}</s-text>) :
        <s-paragraph color="subdued">Je hebt nog geen standaardadres ingesteld.</s-paragraph>}
      <s-button href="shopify:customer-account/profile">Adressen beheren</s-button>
      <s-text color="subdued">Voeg een adres toe, wijzig het of kies een standaardadres in je Shopify-profiel.</s-text>
    </Card>
    <s-paragraph color="subdued">Wil je uitloggen? Gebruik het accountmenu bovenaan deze pagina.</s-paragraph>
  </s-stack>;
}

function Products({orders, supportUrl, warrantyUrl}: {orders: Order[]; supportUrl?: string; warrantyUrl?: string}) {
  if (!orders.length) return <Empty heading="Je producten krijgen hier hun plek">Na je eerste bestelling vind je hier je gekochte producten en beschikbare garantiegegevens.</Empty>;
  return <s-stack gap="large">
    <s-paragraph color="subdued">Hier vind je de artikelen uit je bestellingen, ook als een product niet meer in de winkel staat. Een retour of annulering kan gevolgen hebben voor de dekking.</s-paragraph>
    {warrantyUrl && <s-link href={warrantyUrl}>Bekijk onze garantievoorwaarden</s-link>}
    {orders.map(order => <ProductOrder key={order.id} order={order} supportUrl={supportUrl} />)}
  </s-stack>;
}
function ProductOrder({order, supportUrl}: {order: Order; supportUrl?: string}) {
  const [raw, setRaw] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setRaw(null); setLoading(true); setFailed(false);
    accountQuery(WARRANTY_QUERY, {id: order.id}, {signal: controller.signal})
      .then(result => {if (!controller.signal.aborted) setRaw(result.order?.metafield?.value || null);})
      .catch(() => {if (!controller.signal.aborted) setFailed(true);})
      .finally(() => {if (!controller.signal.aborted) setLoading(false);});
    return () => controller.abort();
  }, [order.id, attempt]);
  return <Card heading={`${order.name} · ${date(order.createdAt)}`}>
    <OrderBadges order={order} />
    {order.lineItems.nodes.map(line => {
      const warranty = warrantyFor(raw, line.id);
      return <s-box key={line.id} padding="base" background="subdued" borderRadius="base">
        <s-stack gap="base"><LineItem line={line} />
          <s-paragraph color="subdued">{loading ? 'Garantiegegevens ophalen…' : failed ? 'Garantiegegevens zijn nu niet bereikbaar.' :
            warranty?.description || 'Voor dit artikel zijn nog geen specifieke garantiegegevens vastgelegd. Vraag ons naar de voorwaarden voor jouw aankoop.'}</s-paragraph>
          {warranty?.expiresOn && <s-text>Vastgelegde einddatum: {date(`${warranty.expiresOn}T12:00:00Z`)}</s-text>}
          {supportUrl && <s-link href={serviceLink(supportUrl, order.name, 'Garantie', line.name)}>Ondersteuning voor dit product</s-link>}
        </s-stack>
      </s-box>;
    })}
    {failed && <s-button onClick={() => setAttempt(a => a + 1)}>Garantiegegevens opnieuw ophalen</s-button>}
    {order.lineItems.pageInfo.hasNextPage && <s-text color="subdued">Deze bestelling heeft meer artikelen. Open de bestelling om ze allemaal te bekijken.</s-text>}
    <s-link href={httpsUrl(order.statusPageUrl)}>Volledige bestelling bekijken</s-link>
  </Card>;
}

function Support({orders, supportUrl, faqUrl, warrantyUrl}: {orders: Order[]; supportUrl?: string; faqUrl?: string; warrantyUrl?: string}) {
  return <s-stack gap="large">
    <Card heading="Hoe kunnen we je helpen?">
      <s-paragraph color="subdued">Een vraag over je toestel, levering of garantie? Stuur ons een bericht met je bestelnummer. Zo kunnen we gericht met je meekijken.</s-paragraph>
      {supportUrl ? <s-button href={supportUrl} variant="primary">{supportUrl.startsWith('mailto:') ? 'Mail onze klantenservice' : 'Neem contact op'}</s-button> :
        <s-paragraph>De servicepagina is nog niet gekoppeld. Gebruik de contactgegevens in de webshop.</s-paragraph>}
      <s-stack direction="inline" gap="base">{faqUrl && <s-link href={faqUrl}>Veelgestelde vragen</s-link>}
        {warrantyUrl && <s-link href={warrantyUrl}>Garantievoorwaarden</s-link>}</s-stack>
    </Card>
    <Card heading="Retourneren of hulp bij je bestelling">
      <s-paragraph color="subdued">Open je bestelling en kies de beschikbare retouroptie. Shopify toont deze wanneer je bestelling volgens de ingestelde retourvoorwaarden in aanmerking komt. Geen retouroptie zichtbaar? Neem contact met ons op.</s-paragraph>
      <s-button href="shopify:customer-account/orders">Kies een bestelling voor retour</s-button>
      {orders.slice(0, 3).map(order => <s-box key={order.id} padding="base" background="subdued" borderRadius="base">
        <s-stack gap="small"><s-text type="strong">{order.name} · {date(order.createdAt)}</s-text>
          <s-stack direction="inline" gap="base"><s-link href={httpsUrl(order.statusPageUrl)}>Bestelling &amp; retouropties</s-link>
            {supportUrl && <s-link href={serviceLink(supportUrl, order.name, 'Bestelling')}>Hulp bij deze bestelling</s-link>}</s-stack>
        </s-stack></s-box>)}
    </Card>
    <s-details><s-summary>Waar vind ik mijn Track &amp; Trace?</s-summary>
      <s-paragraph>In Mijn bestellingen verschijnt een trackinglink zodra Shopify die bij je zending heeft. Bij meerdere pakketten kunnen er meerdere links zijn.</s-paragraph>
    </s-details>
    <s-details><s-summary>Waarom zie ik geen garantieperiode?</s-summary>
      <s-paragraph>We tonen alleen garantiegegevens die voor jouw aankoop zijn vastgelegd. Ontbreken ze? Neem contact op met je bestelnummer; we kijken het voor je na.</s-paragraph>
    </s-details>
    <s-details><s-summary>Kan ik mijn bezorgadres aanpassen?</s-summary>
      <s-paragraph>Op Mijn gegevens beheer je je opgeslagen adressen. Dit verandert het adres van een al geplaatste bestelling niet. Neem voor zo'n wijziging contact met ons op.</s-paragraph>
    </s-details>
  </s-stack>;
}

function Favorites({customerId}: {customerId: string}) {
  const api = useApi<'customer-account.page.render'>();
  const [ids, setIds] = useState<string[]>([]);
  const [digest, setDigest] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [results, setResults] = useState<Product[]>([]);
  const [term, setTerm] = useState('');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [attempt, setAttempt] = useState(0);
  const live = useRef(true);
  const pending = useRef(false);
  const searchSequence = useRef(0);
  useEffect(() => {
    live.current = true;
    const controller = new AbortController();
    setReady(false); setError(''); setIds([]); setProducts([]); setDigest(null);
    accountQuery(WISHLIST_QUERY, {}, {signal: controller.signal}).then(async result => {
      if (result.customer?.id !== customerId) throw new Error('access');
      const next = wishlistIds(result.customer.metafield?.value);
      const data = next.length ? await api.query<{nodes: (Product | null)[]}>(PRODUCTS_QUERY, {variables: {ids: next}}) : {data: {nodes: []}};
      if ('errors' in data && data.errors?.length) throw new Error('api');
      if (!controller.signal.aborted) {
        setIds(next); setDigest(result.customer.metafield?.compareDigest || null);
        setProducts((data.data?.nodes || []).filter(Boolean) as Product[]); setReady(true);
      }
    }).catch(() => {if (!controller.signal.aborted) setError('Je favorieten konden niet worden opgehaald. Probeer het opnieuw.');});
    return () => {live.current = false; controller.abort(); searchSequence.current++;};
  }, [customerId, attempt, api]);

  async function save(next: string[]) {
    if (pending.current || !ready) return;
    pending.current = true; setBusy(true); setError(''); setNotice('');
    try {
      const result = await accountQuery(WISHLIST_MUTATION, {metafields: wishlistInput(customerId, next, digest)});
      if (result.metafieldsSet.userErrors.length || !result.metafieldsSet.metafields?.[0]) {
        throw new Error('conflict');
      }
      if (!live.current) return;
      setIds(next); setDigest(result.metafieldsSet.metafields[0].compareDigest);
      setProducts(previous => [...previous, ...results.filter(p => next.includes(p.id) && !previous.some(x => x.id === p.id))]);
      setNotice('Je favorieten zijn bijgewerkt.');
    } catch {
      if (!live.current) return;
      setReady(false); // Unknown mutation outcome or CAS conflict: refetch before retry.
      setError('Opslaan is niet bevestigd. Laad je favorieten opnieuw voordat je verdergaat.');
    } finally {pending.current = false; if (live.current) setBusy(false);}
  }
  async function search() {
    if (pending.current || term.trim().length < 2) return;
    const sequence = ++searchSequence.current;
    pending.current = true; setBusy(true); setError('');
    try {
      const result = await api.query(SEARCH_QUERY, {variables: {query: productSearch(term)}});
      if (result.errors?.length) throw new Error('api');
      if (live.current && sequence === searchSequence.current) {
        setResults((result.data as {products: {nodes: Product[]}}).products.nodes);
        setNotice('Zoekresultaten bijgewerkt.');
      }
    } catch {if (live.current) setError('Zoeken is niet gelukt. Probeer het opnieuw.');}
    finally {pending.current = false; if (live.current) setBusy(false);}
  }
  const renderProduct = (product: Product, saved: boolean) => <Card key={product.id}>
    <s-grid gridTemplateColumns="auto minmax(0, 1fr)" gap="base" alignItems="center">
      <s-product-thumbnail src={httpsUrl(product.featuredImage?.url)} alt={product.featuredImage?.altText || product.title} />
      <s-stack gap="small"><s-text type="strong">{product.title}</s-text>
        {!product.availableForSale && <s-text color="subdued">Momenteel niet beschikbaar</s-text>}
        {httpsUrl(product.onlineStoreUrl) && <s-link href={httpsUrl(product.onlineStoreUrl)}>Bekijk product</s-link>}</s-stack>
    </s-grid>
    <s-button disabled={!ready || busy || (!saved && ids.length >= 100)}
      accessibilityLabel={`${saved ? 'Verwijder' : 'Bewaar'} ${product.title}`}
      onClick={() => void save(saved ? ids.filter(id => id !== product.id) : [...ids, product.id])}>
      {saved ? 'Verwijderen uit favorieten' : 'Bewaar als favoriet'}</s-button>
  </Card>;
  return <s-stack gap="large">
    <s-paragraph color="subdued">Bewaar maximaal 100 producten in je account. Een favoriet reserveert geen voorraad.</s-paragraph>
    {error && <s-banner tone="critical"><s-stack gap="base"><s-paragraph>{error}</s-paragraph>
      {!ready && <s-button onClick={() => setAttempt(a => a + 1)}>Favorieten opnieuw laden</s-button>}</s-stack></s-banner>}
    {notice && <s-box accessibilityRole="status"><s-text>{notice}</s-text></s-box>}
    {!ready && !error && <Loading />}
    {ready && <>
      {!ids.length && <Empty heading="Ruimte voor jouw volgende favoriet">Zoek hieronder een product en bewaar het voor later.</Empty>}
      {products.filter(p => ids.includes(p.id)).map(p => renderProduct(p, true))}
      {ids.filter(id => !products.some(p => p.id === id)).map(id => <Card key={id} heading="Product niet meer beschikbaar">
        <s-paragraph color="subdued">Dit product is niet meer zichtbaar in de webshop.</s-paragraph>
        <s-button disabled={busy} onClick={() => void save(ids.filter(x => x !== id))}>Verwijderen uit favorieten</s-button>
      </Card>)}
      <Card heading="Vind je volgende favoriet">
        <s-text-field label="Zoek een product" value={term} onInput={e => setTerm((e.currentTarget as HTMLElementTagNameMap['s-text-field']).value || '')} />
        <s-button loading={busy} disabled={term.trim().length < 2} onClick={() => void search()}>Zoeken</s-button>
      </Card>
      {results.length > 0 && <s-heading>Gevonden producten</s-heading>}
      {results.map(p => renderProduct(p, ids.includes(p.id)))}
      {notice === 'Zoekresultaten bijgewerkt.' && !results.length && <s-paragraph>Geen producten gevonden. Probeer een andere zoekterm.</s-paragraph>}
    </>}
  </s-stack>;
}
