/* Public inventory snapshots, isolated browser drafts, and optional authenticated publishing. */
(() => {
  'use strict';
  const root = document.querySelector('[data-catalogue]');
  if (!root) return;
  let original = JSON.parse(document.getElementById('catalogue-data').textContent);
  const key = 'nyc-catalogue-v1:' + original.store;
  const statuses = { confirm: 'Ask about availability', available: 'In stock', low: 'Limited stock', unavailable: 'Out of stock' };
  let data = structuredClone(original), storageAvailable = true, selected = null, lastFocus;
  let localChanges=false;
  const editMode = new URLSearchParams(location.search).get('edit') === '1';
  const $ = id => document.getElementById(id);
  const make = (tag, className, text) => {
    const el = document.createElement(tag);
    if (className) el.className = className;
    if (text !== undefined) el.textContent = text;
    return el;
  };
  function validate(raw) {
    if (!raw || raw.version !== 1 || raw.store !== original.store || !Array.isArray(raw.products) || raw.products.length > 500)
      throw Error('Choose a catalogue exported for this store (maximum 500 products).');
    const ids = new Set();
    const text = (v, max, field) => {
      if (typeof v !== 'string' || v.length > max) throw Error('Check the ' + field + ' field.');
      return v.trim();
    };
    return { version: 1, store: original.store, products: raw.products.map(p => {
      const id = text(p.id, 100, 'product ID');
      if (!id || ids.has(id)) throw Error('Every product needs a unique ID.');
      ids.add(id);
      const name = text(p.name, 100, 'product name');
      const category = text(p.category, 60, 'collection');
      if (!name || !category) throw Error('Product name and collection are required.');
      const price = p.price === null || p.price === '' ? null : Number(p.price);
      const quantity = p.quantity === null || p.quantity === '' ? null : Number(p.quantity);
      if (price !== null && (!Number.isFinite(price) || price < 0 || price > 10000000)) throw Error('Prices must be zero or a positive amount.');
      if (quantity !== null && (!Number.isSafeInteger(quantity) || quantity < 0)) throw Error('Stock quantity must be a whole number of zero or more.');
      if (!Object.hasOwn(statuses, p.status)) throw Error('Choose a valid stock status.');
      const image = text(p.image || '', 800, 'image URL');
      if (image && !/^(?:https:\/\/|photos\/[a-zA-Z0-9_.-]+$)/.test(image)) throw Error('Use an HTTPS photo URL or a local photos/filename image.');
      return { id, name, category, price, quantity, status: p.status,
        description: text(p.description || '', 1500, 'description'),
        material: text(p.material || '', 100, 'details'),
        image, illustration: text(p.illustration || 'object', 40, 'illustration'), demo: p.demo !== false };
    }) };
  }
  try {
    const saved = localStorage.getItem(key);
    if (saved && editMode) { data = validate(JSON.parse(saved)); localChanges=true; }
  } catch (e) {
    storageAvailable = false;
    $('catalogue-notice').textContent = 'The sample collection is open. Browser storage is unavailable or its saved catalogue could not be read; export edits to keep them.';
  }
  function save(message) {
    localChanges=true;
    let stored = false;
    try { localStorage.setItem(key, JSON.stringify(data)); stored = true; storageAvailable = true; } catch { storageAvailable = false; }
    $('editor-status').textContent = message + (stored ? ' Saved on this browser. Export a file for handoff.' : ' Not saved in this browser. Export a file to keep these changes.');
    render();
  }
  const money = p => p.price === null ? 'Price on enquiry' : new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(p.price);
  function imageFor(p, className = '') {
    const frame = make('div', 'object-image ' + className);
    if (p.image) {
      const img = make('img'); img.src = p.image; img.alt = p.name; img.loading = 'lazy';
      img.addEventListener('error', () => { img.remove(); frame.append(make('p', 'photo-unavailable', 'Photo unavailable')); }, { once: true });
      frame.append(img);
    } else {
      const img = make('img'); img.src = 'catalogue-art/' + (/^[a-z-]+$/.test(p.illustration) ? p.illustration : 'object') + '.svg';
      img.alt = ''; img.loading = 'lazy'; frame.append(img);
      frame.append(make('span', 'illustration-caption', 'Illustrated study'));
    }
    return frame;
  }
  function categories() {
    const previous = $('collection-filter').value;
    $('collection-filter').replaceChildren(new Option('All collections', ''));
    for (const c of [...new Set(data.products.map(p => p.category))].sort()) $('collection-filter').add(new Option(c, c));
    if ([...$('collection-filter').options].some(o => o.value === previous)) $('collection-filter').value = previous;
  }
  function render() {
    const samples=data.products.filter(p=>p.demo).length;
    $('catalogue-notice').textContent=samples ? 'Demo collection. '+samples+' sample '+(samples===1?'item is':'items are')+' marked below. Confirm products, prices and availability with the store.' : 'Confirm current availability, product details and prices with the store before visiting.';
    categories();
    const q = $('product-search').value.trim().toLowerCase(), cat = $('collection-filter').value, stock = $('stock-filter').value;
    let rows = data.products.filter(p => (!q || [p.name, p.category, p.description, p.material].join(' ').toLowerCase().includes(q)) && (!cat || p.category === cat) && (!stock || p.status === stock));
    const sort = $('product-sort').value;
    if (sort === 'name') rows.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === 'price') rows.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    $('product-count').textContent = rows.length + ' of ' + data.products.length + ' products';
    $('catalogue-grid').replaceChildren();
    for (const p of rows) {
      const article = make('article', 'collection-piece');
      const open = make('button', 'piece-open'); open.type = 'button'; open.setAttribute('aria-label', 'View ' + p.name);
      open.append(imageFor(p));
      const text = make('div', 'piece-copy');
      text.append(make('p', 'piece-collection', p.category), make('h2', '', p.name), make('p', 'piece-material', p.material), make('p', 'piece-price', money(p)));
      const state = make('p', 'piece-stock', statuses[p.status]);
      if (p.quantity !== null) state.append(document.createTextNode(' · ' + p.quantity + ' remaining'));
      text.append(state);
      if (p.demo) text.append(make('p', 'sample-label', 'Sample item'));
      open.append(text); open.addEventListener('click', () => show(p.id)); article.append(open);
      if (editMode) { const b = make('button', 'edit-product', 'Edit product'); b.type = 'button'; b.addEventListener('click', () => edit(p.id)); article.append(b); }
      $('catalogue-grid').append(article);
    }
    $('catalogue-empty').hidden = rows.length !== 0;
    if (rows.length === 0) $('catalogue-empty').textContent = data.products.length ? 'No pieces match this search. Try another collection or clear the filters.' : 'The collection is empty. Add a product in the catalogue editor.';
  }
  function show(id) {
    const p = data.products.find(p => p.id === id); if (!p) return;
    lastFocus = document.activeElement;
    $('piece-media').replaceChildren(imageFor(p));
    $('piece-title').textContent = p.name;
    $('piece-category').textContent = p.category;
    $('piece-description').textContent = p.description;
    $('piece-detail').textContent = p.material;
    $('piece-amount').textContent = money(p);
    $('piece-availability').textContent = statuses[p.status] + (p.quantity !== null ? ' · ' + p.quantity + ' remaining' : '');
    $('piece-sample').hidden = !p.demo;
    $('piece-dialog').showModal(); $('close-piece').focus();
  }
  function closeDialog(dialog) { dialog.close(); if (lastFocus?.isConnected) lastFocus.focus(); }
  $('close-piece').addEventListener('click', () => closeDialog($('piece-dialog')));
  $('piece-dialog').addEventListener('click', e => { if (e.target === $('piece-dialog')) closeDialog($('piece-dialog')); });
  $('piece-dialog').addEventListener('cancel', () => { if (lastFocus?.isConnected) lastFocus.focus(); });
  for (const id of ['product-search', 'collection-filter', 'stock-filter', 'product-sort']) $(id).addEventListener(id === 'product-search' ? 'input' : 'change', render);
  $('clear-filters').addEventListener('click', () => { $('product-search').value = ''; $('collection-filter').value = ''; $('stock-filter').value = ''; $('product-sort').value = ''; render(); $('product-search').focus(); });
  const form = $('product-form');
  function edit(id) {
    const p = data.products.find(p => p.id === id) || { name: '', category: '', price: null, quantity: null, status: 'confirm', description: '', material: '', image: '', illustration: original.products[0]?.illustration || 'object', demo: true };
    selected = id || null; lastFocus = document.activeElement;
    for (const field of ['name', 'category', 'price', 'quantity', 'status', 'description', 'material', 'image', 'illustration']) form.elements[field].value = p[field] ?? '';
    form.elements.demo.checked = p.demo;
    $('edit-heading').textContent = id ? 'Edit product' : 'Add product';
    $('remove-product').hidden = !id;
    $('form-error').textContent = '';
    $('editor-dialog').showModal(); form.elements.name.focus();
  }
  $('cancel-edit').addEventListener('click', () => closeDialog($('editor-dialog')));
  $('add-product').addEventListener('click', () => edit());
  form.addEventListener('submit', e => {
    e.preventDefault();
    try {
      const product = { id: selected || (crypto.randomUUID ? crypto.randomUUID() : 'item-' + Date.now()), demo: form.elements.demo.checked };
      for (const field of ['name', 'category', 'price', 'quantity', 'status', 'description', 'material', 'image', 'illustration']) product[field] = form.elements[field].value;
      const next = structuredClone(data); const i = next.products.findIndex(p => p.id === selected);
      if (i >= 0) next.products[i] = product; else next.products.push(product);
      data = validate(next); closeDialog($('editor-dialog')); save('Product updated.');
    } catch (error) { $('form-error').textContent = error.message; }
  });
  $('remove-product').addEventListener('click', () => {
    if (!confirm('Remove this product from this browser’s demo catalogue?')) return;
    data.products = data.products.filter(p => p.id !== selected); closeDialog($('editor-dialog')); save('Product removed.');
  });
  $('export-catalogue').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob);
    const a = make('a'); a.href = url; a.download = original.store + '-catalogue.json'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    $('editor-status').textContent = 'Catalogue file exported. Keep it to restore or share this version.';
  });
  $('import-catalogue').addEventListener('change', async e => {
    const file = e.target.files[0]; if (!file) return;
    try {
      if (file.size > 2000000) throw Error('Choose a JSON catalogue under 2 MB.');
      const next = validate(JSON.parse(await file.text()));
      if (!confirm('Replace this browser’s catalogue with ' + next.products.length + ' imported products?')) return;
      data = next; save('Catalogue imported.');
    } catch (error) { $('editor-status').textContent = 'Import failed. ' + error.message; }
    e.target.value = '';
  });
  $('reset-catalogue').addEventListener('click', () => {
    if (!confirm('Restore the original sample collection on this browser? Export first if you want to keep your edits.')) return;
    data = structuredClone(original); save('Original sample collection restored.');
  });
  $('catalogue-editor').hidden = !editMode;
  document.body.classList.toggle('editing-catalogue', editMode);
  window.addEventListener('storage', e => { if (editMode && e.key === key) { try { localChanges=true; data = e.newValue ? validate(JSON.parse(e.newValue)) : structuredClone(original); render(); } catch {} } });
  const initialCategory = new URLSearchParams(location.search).get('collection');
  categories();
  if (initialCategory && [...$('collection-filter').options].some(o => o.value === initialCategory)) $('collection-filter').value = initialCategory;
  root.classList.add('catalogue-ready');
  render();
  fetch('inventory.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('unavailable');return r.json()}).then(raw=>{original=validate(raw);if(!localChanges){data=structuredClone(original);render();}}).catch(()=>{});
  const publish=document.getElementById('publish-catalogue');
  if(publish&&editMode){publish.hidden=true;fetch('/api/catalogues/'+encodeURIComponent(original.store),{cache:'no-store'}).then(r=>{if(!r.ok||!String(r.headers.get('content-type')).includes('application/json'))throw Error('Static host');return r.json();}).then(raw=>{if(raw.store===original.store)publish.hidden=false;}).catch(()=>{const help=document.querySelector('.editor-help');if(help)help.append(' This hosted copy supports drafts and export. Send the exported file to your administrator to update the hosted catalogue.');});}
  if(publish)publish.addEventListener('click',()=>{document.getElementById('publish-dialog').showModal();document.getElementById('publish-key').focus();});
  document.getElementById('cancel-publish')?.addEventListener('click',()=>document.getElementById('publish-dialog').close());
  document.getElementById('publish-form')?.addEventListener('submit',async e=>{e.preventDefault();const button=e.target.querySelector('button[type=submit]');button.disabled=true;const status=document.getElementById('publish-status');status.textContent='Publishing…';try{const response=await fetch('/api/catalogues/'+encodeURIComponent(original.store),{method:'PUT',headers:{'Content-Type':'application/json','Authorization':'Bearer '+document.getElementById('publish-key').value.trim()},body:JSON.stringify(data)});const result=await response.json();if(!response.ok)throw Error(result.error||'Unable to publish.');status.textContent='Published '+result.products+' products. The public collection now shows this version.';document.getElementById('editor-status').textContent=status.textContent;document.getElementById('publish-key').value='';}catch(error){status.textContent='Not published. '+(error.message.includes('Unexpected')?'Publishing requires the campaign server. Your local edits are still available to export.':error.message);}finally{button.disabled=false;}});
})();
