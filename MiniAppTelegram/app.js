/**
 * Mini app Telegram — offerte da Apps Script, filtro come il radar (geohash + Haversine).
 *
 * Allineato a UTILS/geo/geo_geohash.js, UTILS/geo/geo_haversine.js e
 * TELEGRAM/scheduler/scheduler_radar.js (query per ghash locale, poi distanza ≤ raggio).
 */

const WEBAPP_EXEC_BASE =
    'https://script.google.com/macros/s/INSERISCI_ID_DEPLOY/exec';

/** @type {number} fallback se l’API non invia raggio_km (stesso default del radar) */
const RAGGIO_KM_FALLBACK = 5 + 0.12;

(function () {
  const tg = window.Telegram && window.Telegram.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  const elLoading = document.getElementById('state-loading');
  const elError = document.getElementById('state-error');
  const elErrorText = document.getElementById('error-text');
  const elEmpty = document.getElementById('state-empty');
  const elEmptyGeo = document.getElementById('state-empty-geo');
  const elList = document.getElementById('lista-offerte');
  const elGeoToolbar = document.getElementById('geo-toolbar');
  const elGeoToolbarText = document.getElementById('geo-toolbar-text');
  const btnTutte = document.getElementById('btn-tutte');
  const btnVicine = document.getElementById('btn-vicine');
  const btnRiprovaGeo = document.getElementById('btn-riprova-geo');
  const btnEmptyGeoTutte = document.getElementById('btn-empty-geo-tutte');

  /** @type {Array} */
  let cacheOfferte = [];
  /** @type {number} */
  let cacheRaggioKm = RAGGIO_KM_FALLBACK;
  /** @type {number} */
  let cacheGeoPrecisione = 6;
  /** @type {{lat: number, lng: number}|null} */
  let cacheUserPos = null;

  /**
   * Stessa implementazione di generaGeohash in geo_geohash.js (precisione 6 nel radar).
   * @param {number} lat
   * @param {number} lng
   * @param {number} precisione
   * @return {string}
   */
  function generaGeohash(lat, lng, precisione) {
    const caratteri = '0123456789bcdefghjkmnpqrstuvwxyz';
    let hash = '';
    let minLat = -90;
    let maxLat = 90;
    let minLng = -180;
    let maxLng = 180;
    let bit = 0;
    let ch = 0;
    let even = true;

    while (hash.length < precisione) {
      let mid;
      if (even) {
        mid = (minLng + maxLng) / 2;
        if (lng > mid) {
          ch |= (1 << (4 - bit));
          minLng = mid;
        } else {
          maxLng = mid;
        }
      } else {
        mid = (minLat + maxLat) / 2;
        if (lat > mid) {
          ch |= (1 << (4 - bit));
          minLat = mid;
        } else {
          maxLat = mid;
        }
      }
      even = !even;
      if (bit < 4) {
        bit++;
      } else {
        hash += caratteri[ch];
        bit = 0;
        ch = 0;
      }
    }
    return hash;
  }

  /**
   * Come getDistanzaGps in geo_haversine.js (km).
   */
  function distanzaKm(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
      return 999999;
    }
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Inversione del radar: utente in cella U → mostra offerte il cui locale ha ghash === U
   * e distanza utente–locale ≤ raggio (come inviaNotificheRadar).
   */
  function datasetSupportaRadar(offerte) {
    return offerte.some(function (o) {
      const g = o.ghash != null ? String(o.ghash) : '';
      if (!g) {
        return false;
      }
      const la = Number(o.lat);
      const ln = Number(o.lng);
      return isFinite(la) && isFinite(ln);
    });
  }

  function filtraComeRadar(offerte, uLat, uLng, raggioKm, precisione) {
    const ug = generaGeohash(uLat, uLng, precisione);
    return offerte.filter(function (o) {
      const og = o.ghash != null ? String(o.ghash) : '';
      if (!og || og !== ug) {
        return false;
      }
      if (o.lat == null || o.lng == null) {
        return false;
      }
      const la = Number(o.lat);
      const ln = Number(o.lng);
      if (!isFinite(la) || !isFinite(ln)) {
        return false;
      }
      return distanzaKm(uLat, uLng, la, ln) <= raggioKm;
    });
  }

  function show(which) {
    elLoading.hidden = which !== 'loading';
    elError.hidden = which !== 'error';
    elEmpty.hidden = which !== 'empty';
    elEmptyGeo.hidden = which !== 'empty-geo';
    elList.hidden = which !== 'list';
  }

  function setError(msg) {
    elErrorText.textContent = msg;
    elGeoToolbar.hidden = true;
    show('error');
  }

  function escapeHtml(s) {
    const d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function formatKm(k) {
    if (!isFinite(k)) {
      return '';
    }
    return (Math.round(k * 10) / 10).toLocaleString('it-IT');
  }

  /**
   * @param {Array} offerte
   * @param {{lat?: number, lng?: number}|null} userPos
   */
  function renderList(offerte, userPos) {
    elList.innerHTML = '';
    offerte.forEach(function (o) {
      const li = document.createElement('li');
      li.className = 'card';

      let distHtml = '';
      if (userPos && isFinite(userPos.lat) && isFinite(userPos.lng) &&
          o.lat != null && o.lng != null) {
        const d = distanzaKm(userPos.lat, userPos.lng, Number(o.lat), Number(o.lng));
        if (d < 999) {
          distHtml = '<p class="meta dist">≈ ' + escapeHtml(formatKm(d)) + ' km da te</p>';
        }
      }

      const maps = o.url_maps
          ? '<a class="btn btn-ghost" href="' + escapeHtml(o.url_maps) +
            '" target="_blank" rel="noopener">Mappa</a>'
          : '';

      const prezzoIni =
          o.prezzo_iniziale && String(o.prezzo_iniziale) !== String(o.prezzo_finale)
              ? '<span class="strike">' + escapeHtml(o.prezzo_iniziale) + ' €</span>'
              : '';

      const linkPrenota = o.link_prenota || '';
      const posti = Number(o.posti_rimasti) || 0;

      li.innerHTML =
          '<h2>' + escapeHtml(o.nome_locale || 'Locale') + '</h2>' +
          (o.indirizzo
              ? '<p class="meta">' + escapeHtml(o.indirizzo) + '</p>'
              : '') +
          distHtml +
          (o.descrizione
              ? '<p class="desc">' + escapeHtml(o.descrizione) + '</p>'
              : '') +
          '<div class="prezzi">' +
          (prezzoIni) +
          '<span class="finale">' + escapeHtml(String(o.prezzo_finale || '')) + ' €</span>' +
          '</div>' +
          '<p class="meta"><span class="badge">' + posti +
          ' posti</span>' +
          (o.scadenza_offerta
              ? ' · entro le ' + escapeHtml(o.scadenza_offerta)
              : '') +
          '</p>' +
          '<div class="actions">' +
          (linkPrenota
              ? '<button type="button" class="btn btn-primary" data-href="' +
                escapeHtml(linkPrenota) + '">Prenota nel bot</button>'
              : '') +
          maps +
          '</div>';

      const btn = li.querySelector('button[data-href]');
      if (btn && linkPrenota) {
        btn.addEventListener('click', function () {
          if (tg && typeof tg.openTelegramLink === 'function') {
            tg.openTelegramLink(linkPrenota);
          } else {
            window.open(linkPrenota, '_blank');
          }
        });
      }

      elList.appendChild(li);
    });
    show('list');
  }

  function updateGeoToolbar(mode) {
    elGeoToolbar.hidden = false;
    btnTutte.hidden = true;
    btnVicine.hidden = true;
    btnRiprovaGeo.hidden = true;

    if (mode === 'near') {
      elGeoToolbarText.textContent =
          'Filtro radar attivo (geohash + max ' +
          formatKm(cacheRaggioKm) + ' km).';
      btnTutte.hidden = false;
    } else if (mode === 'all') {
      if (cacheUserPos) {
        elGeoToolbarText.textContent =
            'Stai vedendo tutte le offerte attive. Usa «Solo vicine» per il filtro radar.';
        btnVicine.hidden = false;
      } else {
        elGeoToolbarText.textContent =
            'Posizione non disponibile: elenco completo. Consenti il GPS per il filtro come sul bot.';
        btnRiprovaGeo.hidden = false;
      }
    } else if (mode === 'no-gps') {
      elGeoToolbarText.textContent =
          'GPS non attivo. Elenco completo; puoi riprovare.';
      btnRiprovaGeo.hidden = false;
    } else if (mode === 'legacy-api') {
      elGeoToolbarText.textContent =
          'Aggiorna il deploy della Web App (api_miniapp) per ghash e coordinate: per ora elenco completo.';
      btnRiprovaGeo.hidden = false;
    }
  }

  function presentaVicine() {
    if (!cacheUserPos) {
      return;
    }
    const vicine = filtraComeRadar(
        cacheOfferte, cacheUserPos.lat, cacheUserPos.lng,
        cacheRaggioKm, cacheGeoPrecisione);
    if (vicine.length === 0) {
      updateGeoToolbar('near');
      show('empty-geo');
      return;
    }
    vicine.sort(function (a, b) {
      const da = distanzaKm(
          cacheUserPos.lat, cacheUserPos.lng, Number(a.lat), Number(a.lng));
      const db = distanzaKm(
          cacheUserPos.lat, cacheUserPos.lng, Number(b.lat), Number(b.lng));
      return da - db;
    });
    updateGeoToolbar('near');
    renderList(vicine, cacheUserPos);
  }

  /**
   * @param {string=} toolbarMode passa 'legacy-api' se il backend non espone ancora ghash/lat/lng.
   */
  function presentaTutte(toolbarMode) {
    updateGeoToolbar(toolbarMode != null ? toolbarMode : 'all');
    renderList(cacheOfferte, cacheUserPos);
  }

  function richiediPosizione() {
    return new Promise(function (resolve) {
      if (!navigator.geolocation || !navigator.geolocation.getCurrentPosition) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
          function (pos) {
            resolve({
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
            });
          },
          function () {
            resolve(null);
          },
          {enableHighAccuracy: true, timeout: 15000, maximumAge: 60000});
    });
  }

  function fetchOfferteJsonp(baseUrl) {
    const trimmed = String(baseUrl || '').trim();
    if (!trimmed || trimmed.indexOf('INSERISCI_ID') !== -1) {
      return Promise.reject(
          new Error('Configura WEBAPP_EXEC_BASE in app.js con l’URL /exec della Web App.'));
    }

    return new Promise(function (resolve, reject) {
      const cbName = 'lmb_cb_' + Date.now();
      let script = null;

      function cleanup() {
        try {
          delete window[cbName];
        } catch (e) { /* ignore */ }
        if (script && script.parentNode) {
          script.parentNode.removeChild(script);
        }
      }

      window[cbName] = function (data) {
        cleanup();
        resolve(data);
      };

      script = document.createElement('script');
      let url;
      try {
        url = new URL(trimmed);
      } catch (e) {
        cleanup();
        reject(new Error('URL Web App non valido.'));
        return;
      }
      url.searchParams.set('mode', 'api_miniapp');
      url.searchParams.set('action', 'offerte');
      url.searchParams.set('callback', cbName);

      script.src = url.toString();
      script.async = true;
      script.onerror = function () {
        cleanup();
        reject(new Error('Impossibile contattare il server (rete o URL errato).'));
      };
      document.head.appendChild(script);
    });
  }

  btnTutte.addEventListener('click', presentaTutte);
  btnVicine.addEventListener('click', presentaVicine);
  btnEmptyGeoTutte.addEventListener('click', presentaTutte);
  btnRiprovaGeo.addEventListener('click', function () {
    show('loading');
    richiediPosizione().then(function (pos) {
      cacheUserPos = pos;
      if (!cacheOfferte.length) {
        show('empty');
        elGeoToolbar.hidden = true;
        return;
      }
      if (pos) {
        if (datasetSupportaRadar(cacheOfferte)) {
          presentaVicine();
        } else {
          presentaTutte('legacy-api');
        }
      } else {
        updateGeoToolbar('no-gps');
        presentaTutte();
      }
    });
  });

  show('loading');

  fetchOfferteJsonp(WEBAPP_EXEC_BASE)
      .then(function (data) {
        if (!data || !data.ok) {
          setError((data && data.error) || 'Risposta non valida dal server.');
          return;
        }
        cacheOfferte = data.offerte || [];
        if (typeof data.raggio_km === 'number' && isFinite(data.raggio_km) && data.raggio_km > 0) {
          cacheRaggioKm = data.raggio_km;
        }
        if (typeof data.geo_precisione === 'number' && data.geo_precisione > 0) {
          cacheGeoPrecisione = data.geo_precisione;
        }

        if (cacheOfferte.length === 0) {
          elGeoToolbar.hidden = true;
          show('empty');
          return;
        }

        return richiediPosizione().then(function (pos) {
          cacheUserPos = pos;
          if (pos && datasetSupportaRadar(cacheOfferte)) {
            presentaVicine();
          } else if (pos) {
            presentaTutte('legacy-api');
          } else {
            updateGeoToolbar('no-gps');
            presentaTutte();
          }
        });
      })
      .catch(function (err) {
        setError(err.message || 'Errore di caricamento.');
      });
})();
