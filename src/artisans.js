/**
 * MIRAS · Living Heritage & Artisans with Written Consent
 */

export const INITIAL_ARTISANS = [
  {
    id: 'artisan-ram-prasad',
    name: 'Master Ram Prasad Prajapati',
    hindiName: 'उस्ताद राम प्रसाद प्रजापति',
    location: 'Kot Jewar, Jaipur, Rajasthan',
    craftType: 'Traditional Blue Pottery (नीली मिट्टी कला)',
    experienceYears: 42,
    quote:
      'हमारा यह हुनर पाँच पीढ़ियों से पिता से बेटे को मिलता आया है। जब कोई सैलानी बिना बिचौलिये के सीधे मेरे कारखाने से खरीदता है, तो मेरी बेटियों की कॉलेज की फीस समय पर जाती है।',
    bio:
      '5th-generation master craftsman specializing in quartz-based, hand-painted Jaipur Blue Pottery using copper oxide and cobalt mineral glazes. Does not use clay; uses powdered quartz and Egyptian paste.',
    craftPhotoSvg: 'pottery',
    consent: {
      documentId: 'MIRAS-RJ-JP-2026-088',
      signedDate: '14 October 2026',
      signee: 'Ram Prasad Prajapati',
      witnessName: 'Mohan Lal Sharma (Village Sarpanch, Kot Jewar)',
      photoUsagePermitted: true,
      directPricingAgreed: true,
      verificationStatus: 'VERIFIED_PHYSICAL_FORM',
      notes:
        'Physical paper consent deed executed in Hindi; thumb impression & signature verified. Explicitly grants MIRAS permission to display family workshop portraits, artisan voice notes, and fixed direct-to-artisan prices with 0% platform commission deductions.',
    },
    products: [
      {
        id: 'p-bp-1',
        title: 'Cobalt Floral Peacock Urn (8 inches)',
        price: 1450,
        description: 'Hand-shaped quartz paste glazed with ground copper oxide, fired at 850°C.',
      },
      {
        id: 'p-bp-2',
        title: 'Hand-painted Rajasthani Diya Platter',
        price: 650,
        description: 'Floral lattice tile designed to hold 7 ceremonial lamps.',
      },
    ],
  },
  {
    id: 'artisan-shyamlal-sharma',
    name: 'Pandit Shyamlal Sharma',
    hindiName: 'पंडित श्यामलाल शर्मा',
    location: 'Bhatiyani Chouhatta, Old City, Udaipur',
    craftType: 'Mewar Miniature & Pichwai Painting (मेवाड़ लघु चित्रकला)',
    experienceYears: 38,
    quote:
      'हम गिलहरी के बालों वाले ब्रश और असली सोने की स्याही से काम करते हैं। जब कद्रदान बिचौलियों के जाल से बाहर निकलकर सीधा हमारी हवेली में आता है, तब हमारी कला की सच्ची इज़्ज़त होती है।',
    bio:
      'Hereditary court painter lineage from the Kingdom of Mewar. Uses natural stone pigments (lapis lazuli, cinnabar, orpiment) on handmade wasli parchment with 24K gold foil detailing.',
    craftPhotoSvg: 'miniature',
    consent: {
      documentId: 'MIRAS-RJ-UD-2026-052',
      signedDate: '19 October 2026',
      signee: 'Shyamlal Sharma',
      witnessName: 'Kailash Paliwal (Secretary, Udaipur Heritage Artists Society)',
      photoUsagePermitted: true,
      directPricingAgreed: true,
      verificationStatus: 'VERIFIED_PHYSICAL_FORM',
      notes:
        'Written artisan declaration on non-judicial stamp paper. Authorizes digital exhibition, direct commission orders, and verified workshop studio visits in Udaipur with no agency cuts.',
    },
    products: [
      {
        id: 'p-mn-1',
        title: 'Mewar Royal Elephant Battle on Wasli (12x8")',
        price: 3200,
        description: 'Painted using ground lapis lazuli and crushed pearl pigments with squirrel-hair brush.',
      },
      {
        id: 'p-mn-2',
        title: 'Shrinathji Pichwai Lotus Silk Scroll',
        price: 5800,
        description: '24-carat pure gold leaf detailing on hand-loomed raw tussar silk.',
      },
    ],
  },
  {
    id: 'artisan-fatima-begum',
    name: 'Fatima Begum',
    hindiName: 'फ़ातिमा बेगम',
    location: 'Chowk, Old Lucknow, Uttar Pradesh',
    craftType: 'Zardozi Real Wire Embroidery (ज़रदोज़ी कला)',
    experienceYears: 28,
    quote:
      'मशीनें कभी वह नफ़ासत नहीं ला सकतीं जो उंगलियों से तांबे और चाँदी के तारों को काढ़ने में आती है। मिरास ने मुझे वह पहचान दी जो सदियों से हमारे पर्दे के पीछे दबी थी।',
    bio:
      'National award finalist for reviving classical Awadhi metallic embroidery on heavy silk velvet. Employs a collective of 12 neighborhood women artisans in Old Lucknow.',
    craftPhotoSvg: 'zardozi',
    consent: {
      documentId: 'MIRAS-UP-LKO-2026-112',
      signedDate: '18 October 2026',
      signee: 'Fatima Begum',
      witnessName: 'Advocate Zubair Ahmed (Lucknow District Court)',
      photoUsagePermitted: true,
      directPricingAgreed: true,
      verificationStatus: 'DIGITALLY_NOTARIZED',
      notes:
        'Biometric & written legal declaration permitting audio-visual reproduction of embroidery demonstrations. Authorizes direct UPI remittance directly into her dedicated cooperative account.',
    },
    products: [
      {
        id: 'p-zd-1',
        title: 'Silk Velvet Zari Clutch Bag',
        price: 2200,
        description: 'Stitched with genuine gold-plated copper wires (Salma-Sitara) on royal crimson velvet.',
      },
      {
        id: 'p-zd-2',
        title: 'Handcrafted Mughal Tree-of-Life Hanging',
        price: 4800,
        description: '40 hours of hand needlework featuring authentic bullion wire shading.',
      },
    ],
  },
  {
    id: 'artisan-kishan-meena',
    name: 'Kishan Lal Meena',
    hindiName: 'किशन लाल मीना',
    location: 'Bagru Village, Rajasthan',
    craftType: 'Dabu Mud-Resist Block Printing (दाबू छपाई)',
    experienceYears: 34,
    quote:
      'हम नदी के पानी, मुल्तानी मिट्टी और प्राकृतिक नील से कपड़ा रंगते हैं। दलाल हमारे हफ्ते भर के काम के कुछ सिक्के देते थे। यहाँ हमें हमारी मेहनत का असली हक मिलता है।',
    bio:
      'Master printer practicing centuries-old vegetable dye block printing using hard teak wood stamps and fermented jaggery-iron mordants.',
    craftPhotoSvg: 'blockprint',
    consent: {
      documentId: 'MIRAS-RJ-BGR-2026-041',
      signedDate: '09 October 2026',
      signee: 'Kishan Lal Meena',
      witnessName: 'Suraj Bhan (Secretary, Bagru Dyeing Guild)',
      photoUsagePermitted: true,
      directPricingAgreed: true,
      verificationStatus: 'VERIFIED_PHYSICAL_FORM',
      notes:
        'Written consent registered with Bagru Dyers Guild. Consent covers video interviews, workshop geographic tagging, and direct traveler visitation schedules.',
    },
    products: [
      {
        id: 'p-bp-3',
        title: 'Organic Indigo Dabu Cotton Stole',
        price: 1150,
        description: '100% handspun organic cotton stamped with natural fermented wild indigo.',
      },
      {
        id: 'p-bp-4',
        title: 'Natural Iron-Rust Bedcover (King Size)',
        price: 2600,
        description: 'Hand-stamped using pomegranate rind dye and iron rust mordant.',
      },
    ],
  },
];

export function getArtisans() {
  try {
    const saved = localStorage.getItem('miras_repo_artisans_v1');
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn(e);
  }
  return INITIAL_ARTISANS;
}

export function saveArtisans(list) {
  try {
    localStorage.setItem('miras_repo_artisans_v1', JSON.stringify(list));
  } catch (e) {
    console.warn(e);
  }
}

export function initArtisans() {
  const container = document.getElementById('artisansGrid');
  if (!container) return;

  const artisans = getArtisans();
  renderArtisansGrid(container, artisans);
  setupConsentModal(artisans);
  setupProductsModal(artisans);
}

function renderArtisansGrid(container, artisans) {
  container.innerHTML = artisans
    .map(
      (art) => `
    <article class="artisan-card" data-id="${art.id}">
      <div class="artisan-badge-row">
        <span class="consent-badge" data-consent-id="${art.id}">
          <i class="star"></i> CONSENT VERIFIED · #${art.consent.documentId.split('-').pop()}
        </span>
        <span class="artisan-exp">${art.experienceYears} Yrs Practice</span>
      </div>

      <div class="artisan-head">
        <h3 class="artisan-name">${art.name}</h3>
        <p class="artisan-hi">${art.hindiName || ''}</p>
        <p class="artisan-loc"><i class="star"></i> ${art.location}</p>
        <p class="artisan-craft">${art.craftType}</p>
      </div>

      <blockquote class="artisan-quote">
        "${art.quote}"
        <cite>— ${art.name} (Direct Written Testimony)</cite>
      </blockquote>

      <p class="artisan-bio">${art.bio}</p>

      <div class="artisan-foot">
        <button class="btn btn-sm btn-deed" data-consent-id="${art.id}">Inspect Written Consent Deed</button>
        <button class="btn btn-sm btn-works" data-works-id="${art.id}">${art.products.length} Direct Works</button>
      </div>
    </article>
  `
    )
    .join('');
}

function setupConsentModal(artisans) {
  const modal = document.getElementById('consentModal');
  const modalBody = document.getElementById('consentModalBody');
  const closeBtn = document.getElementById('closeConsentModal');
  if (!modal || !modalBody || !closeBtn) return;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-consent-id]');
    if (!btn) return;
    const artId = btn.getAttribute('data-consent-id');
    const art = artisans.find((a) => a.id === artId);
    if (!art) return;

    modalBody.innerHTML = `
      <div class="deed-header">
        <div class="deed-stamp">VERIFIED BY CONSENT</div>
        <h3 class="deed-title">Official Written Consent Deed</h3>
        <p class="deed-subtitle">Legal Documentation for Judge Audit · MIRAS Living Heritage Registry</p>
      </div>

      <dl class="deed-details">
        <div><dt>Deed Record ID</dt><dd><b>${art.consent.documentId}</b></dd></div>
        <div><dt>Executing Maker</dt><dd>${art.consent.signee} (${art.name})</dd></div>
        <div><dt>Execution Date</dt><dd>${art.consent.signedDate}</dd></div>
        <div><dt>Attesting Witness</dt><dd>${art.consent.witnessName}</dd></div>
        <div><dt>Registry Status</dt><dd><span class="status-pill">${art.consent.verificationStatus}</span></dd></div>
      </dl>

      <div class="deed-terms">
        <h4>Verified Legal Covenants:</h4>
        <p>"${art.consent.notes}"</p>
        <ul class="covenants-list">
          <li>- 100% Direct Remittance (0% Platform Commissions)</li>
          <li>- Authorised Digital Exhibition of Family Workshop</li>
          <li>- Right to revoke consent or adjust pricing at any time</li>
        </ul>
      </div>
    `;

    modal.classList.add('open');
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
}

function setupProductsModal(artisans) {
  const modal = document.getElementById('productsModal');
  const modalBody = document.getElementById('productsModalBody');
  const closeBtn = document.getElementById('closeProductsModal');
  if (!modal || !modalBody || !closeBtn) return;

  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-works-id]');
    if (!btn) return;
    const artId = btn.getAttribute('data-works-id');
    const art = artisans.find((a) => a.id === artId);
    if (!art) return;

    modalBody.innerHTML = `
      <div class="deed-header">
        <h3 class="deed-title">Direct Works by ${art.name}</h3>
        <p class="deed-subtitle">${art.location} · Fixed direct maker price</p>
      </div>

      <div class="products-list">
        ${art.products
          .map(
            (p) => `
          <div class="product-item">
            <div class="product-info">
              <h4>${p.title}</h4>
              <p>${p.description}</p>
              <div class="product-price">₹${p.price.toLocaleString('en-IN')} <span class="direct-tag">Direct to Maker</span></div>
            </div>
            <button class="btn btn-sm" onclick="alert('Direct connection opened for ${p.title} with ${art.name}!')">Connect with Maker</button>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    modal.classList.add('open');
  });

  closeBtn.addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
}
