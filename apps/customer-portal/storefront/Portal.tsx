import {render, ComponentChildren} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';
import {createSession} from './auth.mjs';
import {createApi, catalogQuery, WEB_ACCOUNT_QUERY, ADDRESSES_QUERY, UPDATE_CUSTOMER, CREATE_ADDRESS, UPDATE_ADDRESS, DELETE_ADDRESS} from './api.mjs';
import {date, money, tracking, httpsUrl, financialLabels, fulfillmentLabels, WARRANTY_QUERY, warrantyFor,
  supportDestination, serviceLink, WISHLIST_QUERY, WISHLIST_MUTATION, PRODUCTS_QUERY, SEARCH_QUERY,
  wishlistIds, wishlistInput, productSearch} from '../extensions/portal/src/api.mjs';
import type {Customer, Order, Line, Product} from '../extensions/portal/src/types';

type Config = {shopId: string; clientId: string; redirectUri: string; nativeUrl: string;
  supportUrl: string; shopEmail: string; wishlist: boolean; shopUrl: string};
type Address = {id: string; firstName: string; lastName: string; address1: string; address2: string;
  city: string; zip: string; countryCode: string; zoneCode: string; phoneNumber: string; formatted: string[]};
type Api = {query: (query: string, vars?: Record<string, unknown>) => Promise<any>; clear: () => void};
const tabs = [{id:'overzicht', title:'Overzicht', icon:'home'}, {id:'bestellingen', title:'Bestellingen', icon:'box'},
  {id:'producten', title:'Producten & garantie', icon:'shield'}, {id:'gegevens', title:'Mijn gegevens', icon:'person'},
  {id:'service', title:'Service', icon:'help'}, {id:'favorieten', title:'Favorieten', icon:'heart'}];
const paths: Record<string, string> = {home:'m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z',
  box:'m3 7 9-4 9 4v10l-9 4-9-4Zm0 0 9 4 9-4M12 11v10M7.5 5l9 4',
  shield:'M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6Zm-4 9 3 3 5-6',
  person:'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2',
  help:'M9 9a3 3 0 1 1 5 2c-1 1-2 1-2 3M12 17v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z',
  heart:'M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z',
  arrow:'M4 12h16m-6-6 6 6-6 6', lock:'M7 10V7a5 5 0 0 1 10 0v3M5 10h14v11H5Z', logout:'M9 4H4v16h5m5-14 6 6-6 6M9 12h11'};
function Icon({name}: {name:string}) {return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name] || paths.arrow}/></svg>;}
function Empty({title, children, icon='box'}: {title:string; children:ComponentChildren; icon?:string}) {return <div class="sp-empty"><span class="sp-emblem"><Icon name={icon}/></span><h3>{title}</h3><p>{children}</p></div>;}
function Notice({children, error=false}: {children:ComponentChildren; error?:boolean}) {return <p class={'sp-notice' + (error ? ' sp-notice--error' : '')} role={error ? 'alert' : 'status'}>{children}</p>;}
function Image({line}: {line:Line}) {const src=httpsUrl(line.image?.url); return <span class="sp-product-image">{src ? <img src={src} alt={line.image?.altText || line.title} loading="lazy" width="90" height="90"/> : <Icon name="box"/>}</span>;}
function External({href, children, className='sp-link'}: {href:string|undefined;children:ComponentChildren;className?:string}) {return href ? <a class={className} href={href}>{children}<Icon name="arrow"/></a> : null;}
function status(order:Order) {return order.cancelledAt ? 'Geannuleerd' : fulfillmentLabels[order.fulfillmentStatus as keyof typeof fulfillmentLabels] || 'Bekijk bestelstatus';}

function OrderCard({order, service}: {order:Order;service?:string}) {
  const [open,setOpen]=useState(false);
  return <article class="sp-order"><header><div><p class="sp-eyebrow">{date(order.createdAt)}</p><h3>Bestelling {order.name}</h3></div><span class={'sp-badge'+(order.fulfillmentStatus==='FULFILLED'?' sp-badge--done':'')}>{status(order)}</span></header>
    <div class="sp-order-preview">{order.lineItems.nodes.slice(0,open?50:2).map(line=><div class="sp-product" key={line.id}><Image line={line}/><div><strong>{line.title}</strong><small>{line.variantTitle && line.variantTitle !== 'Default Title' ? line.variantTitle : 'Apple-product'} · Aantal {line.quantity}</small></div></div>)}</div>
    {!open && order.lineItems.nodes.length>2 && <p class="sp-muted">+ {order.lineItems.nodes.length-2} andere producten</p>}
    <footer><div><strong>{money(order.totalPrice)}</strong><small>{financialLabels[order.financialStatus as keyof typeof financialLabels] || 'Bekijk betaalstatus'}</small></div><button class="sp-link" onClick={()=>setOpen(!open)} aria-expanded={open}>{open?'Minder details':'Bestelgegevens'}<Icon name="arrow"/></button></footer>
    {open && <div class="sp-order-details"><div class="sp-actions"><External href={httpsUrl(order.statusPageUrl)}>Volledige bestelling & retouropties</External>{service && <External href={serviceLink(service,order.name,'Bestelling')}>Hulp bij deze bestelling</External>}</div>
      {tracking(order).map((t:{url:string;company?:string;number?:string},i:number)=><External key={i} href={httpsUrl(t.url)}>Volg je pakket{t.company ? ` · ${t.company}` : ''}{t.number ? ` · ${t.number}` : ''}</External>)}
      {Number(order.totalRefunded?.amount)>0 && <p>Terugbetaald: {money(order.totalRefunded)}</p>}
      {(order.lineItems.pageInfo.hasNextPage||order.fulfillments.pageInfo.hasNextPage) && <p class="sp-muted">Open de volledige bestelling voor alle producten en zendingen.</p>}</div>}
  </article>;
}

function ProductCard({order,line,api,service}: {order:Order;line:Line;api:Api;service?:string}) {
  const [warranty,setWarranty]=useState<ReturnType<typeof warrantyFor>|undefined>(undefined);
  const [busy,setBusy]=useState(false),[error,setError]=useState(false);
  async function load(){setBusy(true);setError(false);try{const d=await api.query(WARRANTY_QUERY,{id:order.id});setWarranty(warrantyFor(d.order?.metafield?.value,line.id));}catch{setError(true);}finally{setBusy(false);}}
  return <article class="sp-card"><div class="sp-product"><Image line={line}/><div><h3>{line.title}</h3><p class="sp-muted">{line.variantTitle!=='Default Title'?line.variantTitle:''}</p></div></div><dl class="sp-pairs"><div><dt>Aankoopdatum</dt><dd>{date(order.createdAt)}</dd></div><div><dt>Bestelling</dt><dd>{order.name}</dd></div></dl>
    {warranty===undefined ? <button class="sp-link" disabled={busy} onClick={load}>{busy?'Garantie ophalen…':'Garantiegegevens bekijken'}<Icon name="shield"/></button> : warranty ? <div class="sp-warranty"><strong>{warranty.description}</strong>{warranty.expiresOn && <p>Vastgelegde einddatum: {date(warranty.expiresOn)}</p>}</div> : <p class="sp-muted">Er zijn geen garantiegegevens voor dit product vastgelegd. Neem contact op voor informatie over jouw aankoop.</p>}
    {error && <Notice error>Garantiegegevens zijn niet beschikbaar. Probeer opnieuw of neem contact op.</Notice>}
    {service && <External href={serviceLink(service,order.name,'Garantie',line.title)}>Ondersteuning aanvragen</External>}</article>;
}

function Profile({customer,api,config,onRefresh}: {customer:Customer;api:Api;config:Config;onRefresh:()=>Promise<void>}) {
  const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false);
  async function save(event:Event){event.preventDefault();const form=new FormData(event.currentTarget as HTMLFormElement);setBusy(true);setMessage('');try{const d=await api.query(UPDATE_CUSTOMER,{input:{firstName:String(form.get('firstName')),lastName:String(form.get('lastName'))}});if(d.customerUpdate.userErrors.length)throw Error();await onRefresh();setError(false);setMessage('Je naam is bijgewerkt.');}catch{setError(true);setMessage('Opslaan is niet gelukt. Controleer je gegevens en probeer opnieuw.');}finally{setBusy(false);}}
  return <><div class="sp-card"><h2>Persoonlijke gegevens</h2><p class="sp-muted">De gegevens van je Shopify-klantaccount.</p><form onSubmit={save}><div class="sp-fields"><label>Voornaam<input name="firstName" defaultValue={customer.firstName || ''} autoComplete="given-name" maxLength={100}/></label><label>Achternaam<input name="lastName" defaultValue={customer.lastName||''} autoComplete="family-name" maxLength={100}/></label></div><button class="btn portalPrimary" disabled={busy}>{busy?'Opslaan…':'Naam opslaan'}</button></form>{message && <Notice error={error}>{message}</Notice>}
    <dl class="sp-pairs"><div><dt>E-mailadres</dt><dd>{customer.emailAddress?.emailAddress||'Niet opgegeven'}</dd></div><div><dt>Telefoonnummer</dt><dd>{customer.phoneNumber?.phoneNumber||'Niet opgegeven'}</dd></div></dl><External href={`${config.nativeUrl}/profile`}>E-mail en telefoon beheren via Shopify</External></div><Addresses api={api} onRefresh={onRefresh}/></>;
}
function Addresses({api,onRefresh}: {api:Api;onRefresh:()=>Promise<void>}) {
  const [items,setItems]=useState<Address[]>([]),[defaultId,setDefaultId]=useState(''),[next,setNext]=useState<string|null>(null);
  const [editing,setEditing]=useState<Address|null|undefined>(undefined),[remove,setRemove]=useState('');
  const [busy,setBusy]=useState(false),[loading,setLoading]=useState(true),[error,setError]=useState(''),[success,setSuccess]=useState('');
  async function load(after?:string){setLoading(true);try{const d=await api.query(ADDRESSES_QUERY,{after});const a=d.customer.addresses;setItems(old=>after?[...old,...a.nodes]:a.nodes);setDefaultId(d.customer.defaultAddress?.id||'');setNext(a.pageInfo.hasNextPage?a.pageInfo.endCursor:null);setError('');}catch{setError('Adressen laden is niet gelukt. Probeer opnieuw.');}finally{setLoading(false);}}
  useEffect(()=>{void load();},[]);
  async function mutation(query:string,vars:Record<string,unknown>){setBusy(true);setError('');setSuccess('');try{const d=await api.query(query,vars);const result:any=Object.values(d)[0];if(result.userErrors.length)throw Error();await load();await onRefresh();setEditing(undefined);setRemove('');setSuccess('Je adresgegevens zijn bijgewerkt.');}catch{setError('Opslaan is niet gelukt. Controleer het adres, land en telefoonnummer en probeer opnieuw.');}finally{setBusy(false);}}
  function save(event:Event){event.preventDefault();const f=new FormData(event.currentTarget as HTMLFormElement);const address=Object.fromEntries(['firstName','lastName','address1','address2','city','zip','countryCode','zoneCode','phoneNumber'].map(k=>[k,String(f.get(k)||'').trim() || (['phoneNumber','zoneCode'].includes(k)?null:'')]));void mutation(editing?UPDATE_ADDRESS:CREATE_ADDRESS,{...(editing?{addressId:editing.id}:{}),address,defaultAddress:f.get('defaultAddress')==='on'});}
  const fields=[['firstName','Voornaam','given-name'],['lastName','Achternaam','family-name'],['address1','Straat en huisnummer','address-line1'],['address2','Toevoeging (optioneel)','address-line2'],['zip','Postcode','postal-code'],['city','Plaats','address-level2'],['countryCode','Landcode (bijv. NL of BE)','country'],['zoneCode','Regiocode (indien van toepassing)','address-level1'],['phoneNumber','Telefoon (optioneel, bijv. +316…)','tel']];
  return <div class="sp-card"><div class="sp-heading"><h2>Bezorgadressen</h2><button class="sp-link" onClick={()=>{setEditing(null);setError('');}}>Adres toevoegen +</button></div>{error && <Notice error>{error} <button class="sp-link" onClick={()=>load()}>Opnieuw laden</button></Notice>}{success && <Notice>{success}</Notice>}
    {loading && <p role="status">Adressen ophalen…</p>}{!loading&&!items.length&&!error && <p class="sp-muted">Je hebt nog geen adres opgeslagen.</p>}
    <div class="sp-addresses">{items.map(a=><article key={a.id} class="sp-address">{a.id===defaultId && <span class="sp-badge">Standaardbezorgadres</span>}<address>{a.formatted.map((line,i)=><span key={i}>{line}<br/></span>)}</address><div class="sp-actions"><button class="sp-link" onClick={()=>{setEditing(a);setError('');}}>Bewerken</button>{a.id!==defaultId && <button class="sp-link" disabled={busy} onClick={()=>mutation(UPDATE_ADDRESS,{addressId:a.id,defaultAddress:true})}>Als standaard</button>}<button class="sp-link" onClick={()=>setRemove(a.id)}>Verwijderen</button></div>{remove===a.id && <div class="sp-notice"><p>Dit adres verwijderen?</p><button class="sp-link" disabled={busy} onClick={()=>mutation(DELETE_ADDRESS,{addressId:a.id})}>Ja, verwijderen</button> <button class="sp-link" onClick={()=>setRemove('')}>Annuleren</button></div>}</article>)}</div>
    {next && <button class="sp-link" disabled={loading} onClick={()=>load(next)}>Meer adressen laden</button>}
    {editing!==undefined && <form onSubmit={save} class="sp-address-form" key={editing?.id||'new'}><h3>{editing?'Adres bewerken':'Nieuw adres'}</h3><div class="sp-fields">{fields.map(([name,label,autocomplete])=><label key={name}>{label}<input name={name} autoComplete={autocomplete} type={name==='phoneNumber'?'tel':'text'} required={['address1','city','countryCode'].includes(name)} maxLength={name==='countryCode'?2:160} pattern={name==='countryCode'?'[A-Z]{2}':undefined} defaultValue={editing?.[name as keyof Address] as string || (name==='countryCode'?'NL':'')}/></label>)}</div><label class="sp-checkbox"><input type="checkbox" name="defaultAddress" defaultChecked={editing?.id===defaultId}/> Gebruik als standaardbezorgadres</label><div class="sp-actions"><button class="btn portalPrimary" disabled={busy}>{busy?'Opslaan…':'Adres opslaan'}</button><button type="button" class="sp-link" onClick={()=>setEditing(undefined)}>Annuleren</button></div></form>}
  </div>;
}

function Wishlist({api,customerId}: {api:Api;customerId:string}) {
  const [ids,setIds]=useState<string[]>([]),[products,setProducts]=useState<Product[]>([]),[results,setResults]=useState<Product[]>([]);
  const [digest,setDigest]=useState<string|null>(null),[loaded,setLoaded]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState('');
  async function load(){try{const d=await api.query(WISHLIST_QUERY);if(d.customer.id!==customerId)throw Error();const mf=d.customer.metafield;const v=wishlistIds(mf?.value);const p=v.length?await catalogQuery(PRODUCTS_QUERY,{ids:v}):{nodes:[]};setIds(v);setProducts(p.nodes.filter(Boolean));setDigest(mf?.compareDigest||null);setLoaded(true);}catch{setError('Favorieten zijn momenteel niet beschikbaar. Probeer later opnieuw.');}}
  useEffect(()=>{void load();},[]);
  async function save(next:string[]){setBusy(true);setError('');try{const d=await api.query(WISHLIST_MUTATION,{metafields:wishlistInput(customerId,next,digest)});if(d.metafieldsSet.userErrors.length)throw Error();await load();}catch{setError('Je favorieten zijn niet opgeslagen. Laad opnieuw voordat je verdergaat.');setLoaded(false);}finally{setBusy(false);}}
  async function search(event:Event){event.preventDefault();setBusy(true);setError('');try{const term=String(new FormData(event.currentTarget as HTMLFormElement).get('term')||'');const d=await catalogQuery(SEARCH_QUERY,{query:productSearch(term)});setResults(d.products.nodes);}catch{setError('Zoeken is niet gelukt. Probeer opnieuw.');}finally{setBusy(false);}}
  function card(p:Product,saved:boolean){return <article class="sp-card sp-product" key={p.id}>{httpsUrl(p.featuredImage?.url) && <img src={httpsUrl(p.featuredImage?.url)} alt={p.featuredImage?.altText||p.title} width="70" height="70" loading="lazy"/>}<div><h3>{p.title}</h3><External href={httpsUrl(p.onlineStoreUrl)}>Bekijk product</External><button class="sp-link" disabled={busy||!loaded||(!saved&&ids.length>=100)} onClick={()=>save(saved?ids.filter(i=>i!==p.id):[...ids,p.id])}>{saved?'Verwijderen':'Bewaren'}</button></div></article>;}
  return <><form class="sp-card sp-search" onSubmit={search}><label>Zoek een product<input name="term" type="search" required minLength={2} maxLength={80} placeholder="Bijvoorbeeld iPhone 16"/></label><button class="btn portalPrimary" disabled={busy}>Zoeken</button></form>{error && <Notice error>{error} <button class="sp-link" onClick={load}>Opnieuw laden</button></Notice>}{!loaded&&!error&&<p role="status">Favorieten ophalen…</p>}{loaded&&!products.length&&<Empty title="Bewaar iets moois." icon="heart">Zoek hierboven een product om het aan je favorieten toe te voegen.</Empty>}<div class="sp-grid">{products.map(p=>card(p,true))}</div>{results.length>0&&<><h2>Zoekresultaten</h2><div class="sp-grid">{results.filter(p=>!ids.includes(p.id)).map(p=>card(p,false))}</div></>}</>;
}

function Portal({config}: {config:Config}) {
  const [session] = useState(()=>createSession(config));
  const [api] = useState<Api>(()=>createApi(config.shopId,session,fetch,()=>clear()));
  const [customer,setCustomer]=useState<Customer|null>(null),[orders,setOrders]=useState<Order[]>([]);
  const [cursor,setCursor]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const [tab,setTab]=useState('overzicht'),[ready,setReady]=useState(false);
  const epoch=useRef(0), channel=useRef<BroadcastChannel>(),main=useRef<HTMLDivElement>(null);
  const service = supportDestination(config.supportUrl,config.shopEmail);
  function clear(){epoch.current++;api.clear();session.clear();setCustomer(null);setOrders([]);setCursor(null);setError('');setBusy(false);}
  async function load(after?:string){const current=epoch.current;setBusy(true);setError('');try{const d=await api.query(WEB_ACCOUNT_QUERY,{after});if(current!==epoch.current)return;if(!d.customer)throw Error();setCustomer(d.customer);setOrders(old=>after?[...old,...d.customer.orders.nodes]:d.customer.orders.nodes);setCursor(d.customer.orders.pageInfo.hasNextPage?d.customer.orders.pageInfo.endCursor:null);}catch{if(current===epoch.current)setError('Je gegevens konden niet worden geladen. Probeer opnieuw of log opnieuw in.');}finally{if(current===epoch.current)setBusy(false);}}
  useEffect(()=>{
    let active=true;
    if ('BroadcastChannel' in window){channel.current=new BroadcastChannel('iselectstore-portal');channel.current.onmessage=()=>clear();}
    const hide=()=>{clear();}; const show=(e:PageTransitionEvent)=>{if(e.persisted)clear();};
    window.addEventListener('pagehide',hide);window.addEventListener('pageshow',show);
    const url=new URL(location.href);
    if(url.searchParams.has('code')||url.searchParams.has('error')){
      // Remove the code before any subsequent navigation or analytics can reuse it.
      history.replaceState(null,'',config.redirectUri);
      setBusy(true);channel.current?.postMessage('account-change');
      session.callback(url).then(()=>{if(active)return load();}).catch(()=>{if(active)setError('Inloggen is niet gelukt of de inloglink is verlopen. Log opnieuw in.');}).finally(()=>{if(active){setBusy(false);setReady(true);}});
    }else setReady(true);
    return ()=>{active=false;clear();channel.current?.close();window.removeEventListener('pagehide',hide);window.removeEventListener('pageshow',show);};
  },[]);
  async function login(){setBusy(true);setError('');try{channel.current?.postMessage('account-change');location.assign(await session.login());}catch{setError('Inloggen is tijdelijk niet beschikbaar. Gebruik de Shopify-accountlink hieronder.');setBusy(false);}}
  async function logout(){api.clear();epoch.current++;setCustomer(null);setOrders([]);channel.current?.postMessage('account-change');try{location.assign(await session.logout());}catch{session.clear();location.assign(config.nativeUrl);}}
  function navigate(id:string){setTab(id);requestAnimationFrame(()=>main.current?.focus());}
  if(!customer)return <div class="portalHero"><div><span class="sp-emblem"><Icon name="person"/></span><p class="portalKicker">Mijn iSelectStore</p><h1>Jouw aankoop.<br/>Alles op één plek.</h1><p class="portalIntro">Je bestellingen, je producten en onze service. Persoonlijk geregeld, in je vertrouwde iSelectStore-omgeving.</p>{error&&<Notice error>{error}</Notice>}<button class="btn portalPrimary" onClick={login} disabled={busy||!ready}>{busy?'Een moment…':'Veilig inloggen'}<Icon name="arrow"/></button><p class="portalSecure"><Icon name="lock"/>Je ontvangt je inlogcode rechtstreeks van Shopify.</p><External href={config.nativeUrl}>Naar Shopify-account</External></div><aside class="portalGuide"><h2>Goed geregeld. Ook na je aankoop.</h2><ol><li><div><strong>Altijd inzicht</strong><small>Je bestellingen en beschikbare trackinglinks bij elkaar.</small></div></li><li><div><strong>Hulp bij je product</strong><small>Garantie-informatie en persoonlijk contact.</small></div></li><li><div><strong>Jouw gegevens</strong><small>Beheer je naam en bezorgadressen op één plek.</small></div></li></ol></aside></div>;
  const visibleTabs=tabs.filter(t=>t.id!=='favorieten'||config.wishlist);
  return <><div class="sp-top"><div><p class="portalKicker">Mijn iSelectStore</p><h1>Welkom{customer.firstName?`, ${customer.firstName}`:''}.</h1><p class="sp-muted">Fijn dat je er bent. Alles voor jouw aankoop, bij elkaar.</p></div><button class="sp-link" onClick={logout}><Icon name="logout"/>Uitloggen</button></div>
    <div class="sp-layout"><nav class="sp-nav" aria-label="Mijn account">{visibleTabs.map(t=><button key={t.id} aria-current={tab===t.id?'page':undefined} onClick={()=>navigate(t.id)}><Icon name={t.icon}/><span>{t.title}</span></button>)}<span class="sp-nav-note"><Icon name="lock"/>Veilig verbonden met Shopify</span></nav>
    <div class="sp-content" tabIndex={-1} ref={main}>{error&&<Notice error>{error}<button class="sp-link" disabled={busy} onClick={()=>load()}>Opnieuw proberen</button></Notice>}
      {tab==='overzicht'&&<><div class="sp-heading"><h2>Je laatste bestelling</h2><button class="sp-link" onClick={()=>navigate('bestellingen')}>Alles bekijken<Icon name="arrow"/></button></div>{orders[0]?<OrderCard key={orders[0].id} order={orders[0]} service={service}/>:<Empty title="Je eerste aankoop begint hier.">Nog geen bestellingen op dit account. Bestel met hetzelfde e-mailadres om je aankopen hier terug te vinden.<br/><External href={`${config.shopUrl}/collections/all`}>Ontdek ons assortiment</External></Empty>}<div class="sp-grid sp-shortcuts">{[{id:'producten',title:'Jouw producten',text:'Aankopen en vastgelegde garantiegegevens.',icon:'shield'},{id:'gegevens',title:'Persoonlijk geregeld',text:'Je naam en bezorgadressen beheren.',icon:'person'},{id:'service',title:'We zijn er voor je',text:'Hulp bij een bestelling, retour of garantie.',icon:'help'}].map(t=><button class="sp-card" onClick={()=>navigate(t.id)} key={t.id}><Icon name={t.icon}/><h3>{t.title}</h3><p>{t.text}</p><Icon name="arrow"/></button>)}</div></>}
      {tab==='bestellingen'&&<><h2>Mijn bestellingen</h2><p class="sp-muted">Van aankoop tot bezorging. Bekijk hieronder de actuele informatie.</p>{orders.map(o=><OrderCard key={o.id} order={o} service={service}/>)}{!orders.length&&<Empty title="Nog geen bestellingen.">Bestellingen met het e-mailadres van dit account verschijnen hier.</Empty>}</>}
      {tab==='producten'&&<><h2>Mijn producten & garantie</h2><p class="sp-muted">We tonen alleen garantiegegevens die voor jouw aankoop zijn vastgelegd.</p><div class="sp-grid">{orders.filter(o=>!o.cancelledAt).flatMap(o=>o.lineItems.nodes.map(l=><ProductCard key={`${o.id}:${l.id}`} order={o} line={l} api={api} service={service}/>))}</div>{!orders.some(o=>!o.cancelledAt&&o.lineItems.nodes.length)&&<Empty title="Je producten komen hier." icon="shield">Na je aankoop vind je hier je producten en beschikbare garantiegegevens.</Empty>}</>}
      {['producten','bestellingen'].includes(tab)&&cursor&&<button class="btn sp-more" disabled={busy} onClick={()=>load(cursor)}>{busy?'Bestellingen ophalen…':'Meer bestellingen laden'}</button>}
      {tab==='gegevens'&&<Profile key={customer.id} customer={customer} api={api} config={config} onRefresh={()=>load()}/>}
      {tab==='favorieten'&&config.wishlist&&<><h2>Mijn favorieten</h2><p class="sp-muted">Bewaar producten voor een volgend bezoek.</p><Wishlist key={customer.id} customerId={customer.id} api={api}/></>}
      {tab==='service'&&<><h2>Hoe kunnen we je helpen?</h2><p class="sp-muted">Kies wat je wilt regelen. We helpen je graag verder.</p><div class="sp-grid">{[{title:'Hulp bij je bestelling',text:'Een vraag over je aankoop of bezorging?',topic:'Bestelling',icon:'box'},{title:'Retourneren',text:'Bekijk je bestelling voor beschikbare retouropties. Geen optie zichtbaar? Neem contact op.',topic:'Retour',icon:'arrow'},{title:'Een garantievraag',text:'Vertel ons om welk product en welke bestelling het gaat.',topic:'Garantie',icon:'shield'},{title:'Persoonlijk contact',text:'Stel je vraag aan onze klantenservice.',topic:'Overig',icon:'help'}].map(s=><article class="sp-card" key={s.topic}><Icon name={s.icon}/><h3>{s.title}</h3><p class="sp-muted">{s.text}</p>{s.topic==='Retour'&&<button class="sp-link" onClick={()=>navigate('bestellingen')}>Open mijn bestellingen<Icon name="arrow"/></button>}{service&&<External href={serviceLink(service,'',s.topic)}>Neem contact op</External>}</article>)}</div><p class="sp-muted">Een servicebericht is geen bevestigde retour. Retouraanvragen verlopen via de beschikbare Shopify-retouroptie of na bevestiging door onze klantenservice.</p></>}
    </div></div></>;
}

const root=document.querySelector<HTMLElement>('[data-storefront-portal]');
const raw=document.querySelector<HTMLScriptElement>('[data-storefront-portal-config]');
if(root&&raw){
  try{const config:Config=JSON.parse(raw.textContent||'{}');
    config.nativeUrl=config.nativeUrl.replace(/\/$/,'');
    if(/^\d+$/.test(config.shopId)&&config.clientId&&new URL(config.redirectUri).origin===location.origin){
      render(<Portal config={config}/>,root);
      document.querySelector<HTMLElement>('[data-portal-fallback]')?.setAttribute('hidden','');
    }
  }catch{/* Keep the genuine native account fallback available on invalid config. */}
}
