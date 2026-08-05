const config = window.STARCOVE_CONFIG || {basePath:'/',routerMode:'hash'};
const basePath = config.basePath || '/';

export function getRoute() {
  if (config.routerMode === 'hash') {
    const raw = location.hash.startsWith('#/') ? location.hash.slice(1) : '/';
    const url = new URL(raw || '/', 'https://starcove.local');
    return { path: decodeURIComponent(url.pathname.replace(/\/+$/,'')||'/'), search:url.search, hash:url.hash };
  }
  let path = location.pathname;
  if (basePath !== '/' && path.startsWith(basePath)) path = `/${path.slice(basePath.length)}`;
  return { path:decodeURIComponent(path.replace(/\/+$/,'')||'/'), search:location.search, hash:location.hash };
}
export function hrefFor(route='/') {
  const normalized = normalizeRoute(route);
  if (config.routerMode === 'hash') return `${basePath}#${normalized}`;
  return `${basePath.replace(/\/$/,'')}${normalized}` || '/';
}
export function navigate(route='/') {
  const normalized=normalizeRoute(route);
  if(config.routerMode==='hash'){
    const next=`#${normalized}`;
    if(location.hash===next) window.dispatchEvent(new HashChangeEvent('hashchange')); else location.hash=next;
  } else {
    history.pushState({},'',hrefFor(normalized));
    window.dispatchEvent(new PopStateEvent('popstate'));
  }
}
export function replaceRoute(route='/') {
  const normalized=normalizeRoute(route);
  if(config.routerMode==='hash') history.replaceState({},'',`${basePath}#${normalized}`); else history.replaceState({},'',hrefFor(normalized));
}
export function bindRouter(callback){ window.addEventListener('popstate',callback); window.addEventListener('hashchange',callback); }
export function normalizeRoute(route='/') { const url=new URL(String(route||'/'),'https://starcove.local'); return `${url.pathname.replace(/\/{2,}/g,'/')}${url.search}${url.hash}`; }
export function externalCanonical(route='/'){ return new URL(hrefFor(route),location.href).href; }
export { config, basePath };
