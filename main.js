// Drug interaction data
const interactionData = {
    'warfarin-aspirin': {
        severity: 'Major',
        description: 'Combined use increases risk of bleeding significantly.',
        recommendation: 'Monitor closely for signs of bleeding. Consider alternative antiplatelet if possible.',
        references: 'Clinical studies have shown increased risk of major bleeding events.'
    },
    'simvastatin-amiodarone': {
        severity: 'Major',
        description: 'Increased risk of myopathy/rhabdomyolysis due to increased simvastatin levels.',
        recommendation: 'Limit simvastatin dose to 20mg daily or consider alternative statin.',
        references: 'FDA drug safety communication (2011)'
    },
    'omeprazole-clopidogrel': {
        severity: 'Moderate',
        description: 'May reduce effectiveness of clopidogrel by inhibiting its conversion to active form.',
        recommendation: 'Consider using alternative acid-reducer like pantoprazole.',
        references: 'Multiple clinical studies and FDA warnings'
    },
    'ciprofloxacin-dairy': {
        severity: 'Moderate',
        description: 'Dairy products can significantly reduce ciprofloxacin absorption by chelation.',
        recommendation: 'Take ciprofloxacin 2 hours before or 6 hours after consuming dairy products.',
        references: 'Multiple pharmacokinetic studies showing reduced bioavailability.'
    }
    // Add more interactions as needed
};

// Defensive: neutralize anchor href="#" on disease links so single clicks don't jump to top
try {
    Array.from(document.querySelectorAll('a.disease-info')).forEach(a => {
        try {
            if (a.getAttribute('href') === '#') a.setAttribute('href', 'javascript:void(0)');
        } catch (e) {}
    });
} catch (e) {}

// Debug: capture-phase click tracer for disease links to detect intercepted events
try {
    document.addEventListener('click', function(e){
        const disease = e.target && e.target.closest && e.target.closest('.disease-info');
        if (!disease) return;
        console.debug('[capture-debug] disease click detected on', disease, 'target=', e.target, 'defaultPrevented=', e.defaultPrevented);
    }, true);
} catch (err) {
    console.error('capture-debug init failed', err);
}

// Main app functionality 
(function(){
    // External navigation handler
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (!a) return;

        const href = a.getAttribute('href') || '';

        if (a.dataset && a.dataset.external === 'true') {
            e.stopImmediatePropagation();
            return;
        }
        if (a.target === '_blank') {
            e.stopImmediatePropagation();
            return;
        }
        if (/^https?:\/\//i.test(href)) {
            e.stopImmediatePropagation();
            return;
        }
        if (href && /\.html(\b|$)/i.test(href)) {
            e.stopImmediatePropagation();
            return;
        }
    }, true);

    // Page navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.hasAttribute('data-external') || 
                (this.getAttribute('href') && this.getAttribute('href').endsWith('.html'))) {
                return;
            }
            const page = this.dataset.page;
            if (!page) return;
            e.preventDefault();
            
            document.querySelectorAll('.page-section').forEach(sec => 
                sec.classList.remove('active')
            );
            const target = document.getElementById(page + '-page');
            if (target) target.classList.add('active');
            
            document.querySelector('.nav-menu')?.classList.remove('open');
        });
    });

    // Mobile menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    // Responsive search behavior
    initResponsiveSearch();

    // Universal search suggestion dropdown for all pages
    initUniversalSearchSuggestions();

    // Welcome alert
    initWelcomeAlert();

    // Tool modal
    initToolModal();

    // Drug interactions checker
    initInteractionChecker();

    // Alphabet filter & search
    initMedicineFilters();

    // Short utility and UI handlers for Clinical Tools
    initToolSystem();

    // Disease popup initialization - show description & causes when a disease is clicked
    function initDiseasePopup() {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');
        const modalClose = document.getElementById('modal-close');

        if (!modalOverlay || !modalTitle || !modalBody) return;

        // Minimal disease dataset (keyed by data-disease attributes in HTML)
        const diseaseData = {
            'hypertension': {
                title: 'Hypertension',
                description: 'A chronic condition characterized by persistently elevated arterial blood pressure which increases risk of cardiovascular disease, stroke, and kidney disease.',
                causes: ['Essential (primary) causes — multifactorial (genetics, salt-sensitivity, age)', 'Secondary causes — renal disease, endocrine disorders, medications, sleep apnea', 'Lifestyle — obesity, physical inactivity, excessive alcohol consumption']
            },
            'coronary-artery-disease': {
                title: 'Coronary Artery Disease',
                description: 'A condition caused by atherosclerotic plaque build-up in the coronary arteries leading to myocardial ischemia and angina or myocardial infarction.',
                causes: ['Atherosclerosis from dyslipidemia', 'Smoking', 'Hypertension', 'Diabetes mellitus', 'Family history and age']
            },
            'heart-failure': {
                title: 'Heart Failure',
                description: 'Syndrome in which the heart is unable to pump sufficiently to maintain blood flow to meet the body’s needs, resulting in symptoms like dyspnea and fluid retention.',
                causes: ['Ischemic heart disease', 'Hypertension', 'Valvular disease', 'Cardiomyopathies', 'Chronic alcohol or toxin exposure']
            },
            'arrhythmias': {
                title: 'Arrhythmias',
                description: 'Abnormal heart rhythms due to disturbances in impulse formation or conduction which may cause palpitations, syncope, or sudden cardiac death.',
                causes: ['Ischemic heart disease', 'Electrolyte disturbances', 'Drug effects (e.g., antiarrhythmics, QT-prolonging agents)', 'Structural heart disease']
            },
            'stroke': {
                title: 'Stroke',
                description: 'Acute neurological deficit resulting from ischemia (ischemic stroke) or bleeding (hemorrhagic stroke) in the brain.',
                causes: ['Thromboembolism from carotid or cardiac sources', 'Hypertension (most important risk factor for hemorrhagic stroke)', 'Atrial fibrillation', 'Small vessel disease']
            },
            'peripheral-artery-disease': {
                title: 'Peripheral Artery Disease',
                description: 'Atherosclerotic obstruction of peripheral arteries causing claudication and increased cardiovascular risk.',
                causes: ['Atherosclerosis', 'Smoking', 'Diabetes', 'Hyperlipidemia', 'Hypertension']
            },
            'asthma': {
                title: 'Asthma',
                description: 'A chronic inflammatory airway disease characterized by variable airflow obstruction and bronchial hyperresponsiveness, causing wheeze, cough and breathlessness.',
                causes: ['Atopy and allergic sensitization', 'Viral respiratory infections', 'Environmental triggers (pollutants, smoke)', 'Exercise, cold air']
            },
            'copd': {
                title: 'Chronic Obstructive Pulmonary Disease (COPD)',
                description: 'Progressive airflow limitation associated with abnormal inflammatory response of the lungs to noxious particles or gases.',
                causes: ['Cigarette smoking (major)', 'Occupational exposures', 'Alpha-1 antitrypsin deficiency', 'Air pollution']
            },
            'pneumonia': {
                title: 'Pneumonia',
                description: 'Acute infection of the pulmonary parenchyma presenting with cough, fever, and infiltrates on chest imaging.',
                causes: ['Bacterial pathogens (e.g., Streptococcus pneumoniae)', 'Viral causes (influenza, RSV, SARS-CoV-2)', 'Aspiration', 'Hospital-acquired organisms']
            },
            'tuberculosis': {
                title: 'Tuberculosis',
                description: 'Infectious disease caused by Mycobacterium tuberculosis, commonly affecting the lungs but may be systemic.',
                causes: ['Infection with M. tuberculosis transmitted via respiratory droplets', 'Immunosuppression (HIV, steroids)', 'Close-contact exposure']
            },
            'influenza': {
                title: 'Influenza',
                description: 'An acute respiratory infection caused by influenza viruses, often seasonal, causing fever, myalgia, cough, and potential complications.',
                causes: ['Infection with influenza A or B viruses', 'Close contact and airborne spread', 'Reduced immunity']
            },
            'covid-19': {
                title: 'COVID-19',
                description: 'Infection caused by SARS-CoV-2 ranging from asymptomatic infection to severe respiratory failure and multisystem disease.',
                causes: ['SARS-CoV-2 exposure and infection', 'Risk factors for severe disease: older age, comorbidities like diabetes, heart disease']
            },
            'alzheimers': {
                title: "Alzheimer's Disease",
                description: 'Progressive neurodegenerative disorder causing memory loss, cognitive decline, and functional impairment.',
                causes: ['Age-related neurodegeneration', 'Genetic predisposition (e.g., APOE4)', 'Amyloid and tau pathologies']
            },
            'parkinsons': {
                title: "Parkinson's Disease",
                description: 'A neurodegenerative movement disorder characterized by bradykinesia, rigidity, tremor, and postural instability.',
                causes: ['Degeneration of dopaminergic neurons in the substantia nigra', 'Genetic and environmental factors']
            },
            'epilepsy': {
                title: 'Epilepsy',
                description: 'A disorder of recurrent, unprovoked seizures due to abnormal neuronal activity.',
                causes: ['Structural brain lesions', 'Genetic conditions', 'Infections, head trauma', 'Metabolic disturbances']
            },
            'multiple-sclerosis': {
                title: 'Multiple Sclerosis',
                description: 'An immune-mediated demyelinating disease of the central nervous system causing variable neurological deficits.',
                causes: ['Autoimmune demyelination with multifactorial triggers including genetic susceptibility and environmental factors']
            },
            'migraine': {
                title: 'Migraine',
                description: 'A primary headache disorder characterized by recurrent attacks of moderate-to-severe head pain often accompanied by nausea and sensitivity to light or sound.',
                causes: ['Genetic predisposition', 'Neurological hyperexcitability', 'Triggers: hormonal changes, certain foods, stress']
            },
            'neuropathy': {
                title: 'Peripheral Neuropathy',
                description: 'Disorder of peripheral nerves causing numbness, tingling, pain, or weakness.',
                causes: ['Diabetes (common)', 'Toxic exposures', 'Vitamin deficiencies', 'Autoimmune disorders']
            },
            'diabetes': {
                title: 'Diabetes Mellitus',
                description: 'Group of metabolic disorders characterized by hyperglycemia from defects in insulin secretion, insulin action, or both.',
                causes: ['Type 1: autoimmune beta-cell destruction', 'Type 2: insulin resistance and relative insulin deficiency', 'Genetic and lifestyle factors']
            },
            'thyroid-disorders': {
                title: 'Thyroid Disorders',
                description: 'Disorders of thyroid function including hypothyroidism and hyperthyroidism affecting metabolism and multiple organ systems.',
                causes: ['Autoimmune disease (Hashimoto, Graves)', 'Iodine deficiency or excess', 'Thyroiditis, nodular disease']
            },
            'osteoporosis': {
                title: 'Osteoporosis',
                description: 'Skeletal disorder characterized by low bone mass and microarchitectural deterioration leading to increased fracture risk.',
                causes: ['Age-related bone loss', 'Postmenopausal estrogen deficiency', 'Glucocorticoid use', 'Poor nutrition and inactivity']
            },
            'metabolic-syndrome': {
                title: 'Metabolic Syndrome',
                description: 'Cluster of metabolic abnormalities (central obesity, dyslipidemia, hypertension, insulin resistance) increasing cardiovascular risk.',
                causes: ['Central obesity', 'Insulin resistance', 'Genetic predisposition', 'Sedentary lifestyle']
            },
            'obesity': {
                title: 'Obesity',
                description: 'Excess adiposity that increases risk for metabolic, cardiovascular and musculoskeletal complications.',
                causes: ['Energy imbalance (excess calorie intake vs expenditure)', 'Genetics, endocrine disorders, medications']
            },
            'gout': {
                title: 'Gout',
                description: 'Inflammatory arthritis caused by deposition of monosodium urate crystals in joints due to hyperuricemia.',
                causes: ['Hyperuricemia from underexcretion or overproduction of uric acid', 'Dietary factors, diuretics, genetics']
            },
            'hiv': {
                title: 'HIV/AIDS',
                description: 'Infection with human immunodeficiency virus leading to progressive immune deficiency and risk of opportunistic infections.',
                causes: ['Transmission via blood, sexual contact, vertical transmission', 'Viral replication and CD4+ T cell depletion']
            },
            'hepatitis': {
                title: 'Hepatitis',
                description: 'Inflammation of the liver caused by viral infection, toxins, or autoimmune processes.',
                causes: ['Viral hepatitis (A, B, C, etc.)', 'Alcoholic or drug-induced liver injury', 'Autoimmune hepatitis']
            },
            'dengue': {
                title: 'Dengue Fever',
                description: 'A mosquito-borne viral infection causing febrile illness that can progress to hemorrhagic manifestations and shock.',
                causes: ['Infection with dengue virus transmitted by Aedes mosquitoes', 'Secondary infection with different serotype increases risk of severe disease']
            },
            'malaria': {
                title: 'Malaria',
                description: 'Parasitic infection of red blood cells caused by Plasmodium species, transmitted by Anopheles mosquitoes.',
                causes: ['Plasmodium infection via mosquito bite', 'Lack of prevention, travel to endemic areas']
            },
            'typhoid': {
                title: 'Typhoid Fever',
                description: 'Systemic infection caused by Salmonella Typhi, presenting with sustained fever, abdominal symptoms, and potential complications.',
                causes: ['Ingestion of contaminated food or water', 'Poor sanitation and hygiene']
            },
            'leptospirosis': {
                title: 'Leptospirosis',
                description: 'Bacterial zoonosis transmitted via animal urine, causing febrile illness that can involve liver and kidneys.',
                causes: ['Exposure to contaminated water or soil with animal urine', 'Occupational or recreational exposure']
            },
            'gerd': {
                title: 'Gastroesophageal Reflux Disease (GERD)',
                description: 'Chronic reflux of gastric contents into the esophagus causing heartburn and regurgitation, and potential complications such as esophagitis.',
                causes: ['Lower esophageal sphincter dysfunction', 'Hiatal hernia', 'Obesity, certain foods and medications']
            },
            'peptic-ulcer': {
                title: 'Peptic Ulcer Disease',
                description: 'Ulceration of the gastric or duodenal mucosa often presenting with epigastric pain, bleeding or perforation.',
                causes: ['Helicobacter pylori infection', 'NSAID use', 'Acid hypersecretion, smoking']
            },
            'ibd': {
                title: 'Inflammatory Bowel Disease (IBD)',
                description: 'Chronic inflammatory disorders of the GI tract, chiefly Crohn’s disease and ulcerative colitis.',
                causes: ['Immune-mediated inflammation with genetic predisposition and environmental triggers']
            },
            'ibs': {
                title: 'Irritable Bowel Syndrome (IBS)',
                description: 'Functional gastrointestinal disorder characterized by abdominal pain and altered bowel habits without identifiable structural disease.',
                causes: ['Gut-brain axis dysfunction', 'Post-infectious changes', 'Dietary triggers and psychosocial factors']
            },
            'hepatitis-gi': {
                title: 'Hepatitis (GI)',
                description: 'See "Hepatitis" entry — inflammation of the liver with various causes.',
                causes: ['Viral infection, toxins, autoimmune processes']
            },
            'pancreatitis': {
                title: 'Pancreatitis',
                description: 'Inflammation of the pancreas causing severe abdominal pain and potential systemic complications.',
                causes: ['Gallstones', 'Alcohol abuse', 'Hypertriglyceridemia', 'Medications and procedures']
            }
        };

        // Attach click and double-click handlers to disease links.
        // Single-click opens the modal; double-click will also open but clears the single-click timer to avoid duplicate opens.
        document.querySelectorAll('.disease-info').forEach(link => {
            let clickTimer = null;

            function openDiseaseModal(elem) {
                const key = elem.dataset.disease;
                const data = diseaseData[key];
                modalTitle.textContent = (data && data.title) ? data.title : elem.textContent.trim();

                if (data) {
                    const causesHtml = Array.isArray(data.causes) ? `<ul style="margin-top:8px;">${data.causes.map(c=>`<li>${c}</li>`).join('')}</ul>` : `<p>${data.causes}</p>`;
                    modalBody.innerHTML = `
                        <div style="color:var(--gray);line-height:1.6;">
                            <p><strong>Description:</strong> ${data.description}</p>
                            <p style="margin-top:8px;"><strong>Causes:</strong></p>
                            ${causesHtml}
                        </div>
                    `;
                } else {
                    modalBody.innerHTML = `<p style="color:var(--gray);">Details for this condition are not yet available.</p>`;
                }

                modalOverlay.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }

            link.addEventListener('click', function(e) {
                // Prevent default navigation and allow single-click modal open.
                e.preventDefault();

                // Clear any existing timer to restart
                if (clickTimer) clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    openDiseaseModal(this);
                    clickTimer = null;
                }, 220); // short delay to allow dblclick to cancel
            });

            link.addEventListener('dblclick', function(e) {
                e.preventDefault();
                if (clickTimer) { clearTimeout(clickTimer); clickTimer = null; }
                openDiseaseModal(this);
            });

            // Keyboard accessibility: allow Enter or Space to open the modal
            if (!link.hasAttribute('tabindex')) link.setAttribute('tabindex', '0');
            link.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openDiseaseModal(this);
                }
            });
        });

        // Safety: ensure modal close behavior (may also be set by initLegalModals)
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = '';
            });
        }
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.style.display === 'block') {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
    initDiseasePopup();

    // Disease suggestion dropdown for Disease Database page - if needed
    function initDiseaseSuggestionDropdown() {
        // Implementation can be added based on requirements
    }
    initDiseaseSuggestionDropdown();

    // Legal modals for Editorial Policy and Advertise With Us
    initLegalModals();
})();

// Helper functions
function initWelcomeAlert() {
    const container = document.getElementById('welcome-alert');
    const text = document.getElementById('welcome-text');
    const close = document.getElementById('close-welcome');
    
    try {
        const dismissed = localStorage.getItem('mims_welcome_dismissed');
        if (!dismissed && container && text) {
            const hour = new Date().getHours();
            let greeting = 'Welcome to MIMS ph — Trusted Medical Information';
            if (hour < 12) greeting = 'Good morning — Welcome to MIMS ph';
            else if (hour < 18) greeting = 'Good afternoon — Welcome to MIMS ph';
            text.textContent = greeting + '. This site is intended for healthcare professionals.';
            container.style.display = 'block';
        }
        if (close) {
            close.addEventListener('click', () => {
                container.style.display = 'none';
                try { localStorage.setItem('mims_welcome_dismissed', '1'); } catch(e){}
            });
        }
    } catch(e){}
}

function initToolModal() {
    const modal = document.getElementById('tool-modal');
    const title = document.getElementById('tool-title');
    const subtitle = document.getElementById('tool-subtitle');
    const body = document.getElementById('tool-body');
    const close = document.getElementById('tool-close');

    // Tool opening handlers
    document.querySelectorAll('.open-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            openTool(tool, modal, title, subtitle, body);
        });
    });

    // Close handlers
    if (close) close.addEventListener('click', () => closeToolModal(modal));
    
    // ESC key handler
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeToolModal(modal);
        }
    });
}

function initInteractionChecker() {
    const checkBtn = document.getElementById('check-interaction-btn');
    if (!checkBtn) return;

    checkBtn.addEventListener('click', () => {
        const drug1 = document.getElementById('drug1-select').value;
        const drug2 = document.getElementById('drug2-select').value;

        if (!drug1 || !drug2) {
            alert('Please select both medications');
            return;
        }

        if (drug1 === drug2) {
            alert('Please select two different medications');
            return;
        }

        checkInteraction(drug1, drug2);
    });
}

function initMedicineFilters() {
    const cards = Array.from(document.querySelectorAll('.medicine-card'));
    const alphaBtns = Array.from(document.querySelectorAll('.alphabet-btn'));
    const dbFilters = Array.from(document.querySelectorAll('.db-filter'));
    const searchInput = document.getElementById('search-input');
    
    let activeLetter = 'all';
    let activeView = 'all';

    function isGenericCard(card) {
        // Prefer explicit marker when available
        const dt = (card.getAttribute('data-type') || '').toLowerCase();
        if (dt === 'generic') return true;
        if (dt === 'brand') return false;

        // Fallback heuristic: inspect the "medicine-generic" text
        const genText = (card.querySelector('.medicine-generic')?.textContent || '').trim().toLowerCase();
        const nameText = (card.querySelector('.medicine-name')?.textContent || '').trim().toLowerCase();

        // If generic field equals the displayed name, treat as generic entry
        if (genText && nameText && genText === nameText) return true;

        // If generic field contains common generic-word markers or is a single simple token, treat as generic
        const genericMarkers = ['hydrochloride','sodium','trihydrate','acetate','phosphate','cilexetil','potassium','calcium','maleate','tartrate'];
        for (const m of genericMarkers) if (genText.includes(m)) return true;

        // If generic field explicitly mentions 'common brand' treat as generic (existing pattern)
        if (genText.includes('common brand') || genText.includes('common brands')) return true;

        // Otherwise assume brand (conservative default)
        return false;
    }

    function applyFilters() {
        cards.forEach(card => {
            const cardLetter = (card.getAttribute('data-letter') || '').toUpperCase();
            const matchesLetter = (activeLetter === 'all' || cardLetter === activeLetter.toUpperCase());
            
            const genericFlag = isGenericCard(card);
            
            let matchesView = true;
            if (activeView === 'brand') matchesView = !genericFlag;
            else if (activeView === 'generic') matchesView = genericFlag;
            
            card.style.display = (matchesLetter && matchesView) ? 'block' : 'none';
        });
    }

    // Alphabet filter
    if (alphaBtns.length) {
        alphaBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                alphaBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                activeLetter = this.getAttribute('data-letter') || 'all';
                applyFilters();
                if (searchInput) searchInput.value = '';
            });
        });
    }

    // Database view filters (from dropdown and in-page controls)
    if (dbFilters.length) {
        dbFilters.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                dbFilters.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                activeView = this.getAttribute('data-view') || 'all';
                applyFilters();
                
                // Update the page heading to reflect the current view
                const viewText = activeView === 'brand' ? 'Brand Name Medicines' : 
                               activeView === 'generic' ? 'Generic Medicines' : 
                               'A-Z Medicine Database';
                const title = document.querySelector('.section-title');
                if (title) title.textContent = viewText + ' (Philippines)';
            });
        });
    }

    // Search filter
    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                searchMedicines(searchInput.value, cards, alphaBtns);
            }, 180);
        });
    }

    // Show all on initial load
    const allAlphaBtn = document.querySelector('.alphabet-btn[data-letter="all"]');
    if (allAlphaBtn) allAlphaBtn.click();
}

// Short utility and UI handlers for Clinical Tools
function initToolSystem() {
    function calculateBMI() {
        const weight = parseFloat(document.getElementById('bmi-weight')?.value);
        const height = parseFloat(document.getElementById('bmi-height')?.value);
        const resultDiv = document.getElementById('bmi-result');
        if (!weight || !height) {
            resultDiv.textContent = 'Please enter both weight and height.';
            return;
        }
        const bmi = weight / ((height/100) * (height/100));
        const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
        resultDiv.innerHTML = `BMI: <strong>${bmi.toFixed(1)}</strong> — ${category}`;
    }

    // Make calculator functions globally available
    window.calculateBMI = calculateBMI;
}

// Utility functions
function openTool(toolId, modal, title, subtitle, body) {
    if (!modal) return;
    
    const toolConfig = getToolConfig(toolId);
    
    // use CSS-driven "open" state so centering/flex works reliably
    modal.setAttribute('aria-hidden', 'false');
    modal.classList.add('open');
    title.textContent = toolConfig.title;
    subtitle.textContent = toolConfig.subtitle;
    body.innerHTML = toolConfig.html;

    // Attach specific tool handlers
    attachToolHandlers(toolId, body);
}

function closeToolModal(modal) {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
}

function checkInteraction(drug1, drug2) {
    const key1 = [drug1, drug2].join('-').toLowerCase();
    const key2 = [drug2, drug1].join('-').toLowerCase();
    const interaction = interactionData[key1] || interactionData[key2];
    
    displayInteractionResult(drug1, drug2, interaction);
}

function displayInteractionResult(drug1, drug2, interaction) {
    const resultDiv = document.getElementById('interaction-result');
    if (!resultDiv) return;

    if (interaction) {
        resultDiv.innerHTML = `
            <div class="medicine-header">
                <h3 class="medicine-name">${drug1.charAt(0).toUpperCase() + drug1.slice(1)} + ${drug2.charAt(0).toUpperCase() + drug2.slice(1)}</h3>
                <div class="medicine-generic">Severity: <span style="color:${getSeverityColor(interaction.severity)}">${interaction.severity}</span></div>
            </div>
            <div class="medicine-content">
                <p class="medicine-desc">${interaction.description}</p>
                <div style="margin-top:12px;">
                    <strong>Recommended action:</strong>
                    <p style="color:var(--gray);margin-top:6px;">${interaction.recommendation}</p>
                </div>
                <div style="margin-top:12px;">
                    <strong>References:</strong>
                    <p style="color:var(--gray);margin-top:6px;font-size:0.9rem;">${interaction.references}</p>
                </div>
            </div>
        `;
    } else {
        resultDiv.innerHTML = `
            <div class="medicine-header">
                <h3 class="medicine-name">${drug1.charAt(0).toUpperCase() + drug1.slice(1)} + ${drug2.charAt(0).toUpperCase() + drug2.slice(1)}</h3>
                <div class="medicine-generic">No significant interaction found</div>
            </div>
            <div class="medicine-content">
                <p class="medicine-desc">No significant interaction has been documented between these medications in our database. However, always consult full prescribing information and use clinical judgment.</p>
            </div>
        `;
    }
    resultDiv.style.display = 'block';
}

function getSeverityColor(severity) {
    const colors = {
        'Major': 'var(--danger)',
        'Moderate': 'var(--warning)',
        'Minor': 'var(--success)'
    };
    return colors[severity] || 'var(--gray)';
}

function filterMedicines(letter, cards) {
    cards.forEach(card => {
        const cardLetter = (card.dataset.letter || '').toUpperCase();
        card.style.display = (!letter || letter.toLowerCase() === 'all' || 
                            cardLetter === letter.toUpperCase()) ? '' : 'none';
    });
}

function searchMedicines(query, cards, alphabetBtns) {
    const q = query.trim().toLowerCase();
    cards.forEach(card => {
        if (!q) {
            card.style.display = '';
            return;
        }
        const name = (card.querySelector('.medicine-name')?.textContent || '').toLowerCase();
        const generic = (card.querySelector('.medicine-generic')?.textContent || '').toLowerCase();
        card.style.display = (name.includes(q) || generic.includes(q)) ? '' : 'none';
    });
    alphabetBtns.forEach(b => b.classList.remove('active'));
}

// Responsive search: toggle, focus, submit and outside click handling
function initResponsiveSearch() {
    // Disable responsive search behavior on the Disease Database page
    if (document.getElementById && document.getElementById('diseases-page')) return;
    const searchBar = document.querySelector('.search-bar');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.querySelector('.search-btn');
    if (!searchBar || !searchBtn || !searchInput) return;

    // On small screens, clicking the button toggles the input visibility first
    searchBtn.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!searchBar.classList.contains('active')) {
                e.preventDefault();
                searchBar.classList.add('active');
                // allow animation to finish then focus
                setTimeout(() => searchInput.focus(), 80);
                return;
            }
            // if already expanded, perform search
        }
        // Desktop behavior or expanded mobile: run global search
        performGlobalSearch();
    });

    // Enter key in search input triggers search
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            performGlobalSearch();
            // on mobile collapse after search
            if (window.innerWidth <= 768) searchBar.classList.remove('active');
        } else if (e.key === 'Escape') {
            searchBar.classList.remove('active');
            searchInput.blur();
        }
    });

    // Click outside closes expanded mobile search
    document.addEventListener('click', (ev) => {
        if (!searchBar.classList.contains('active')) return;
        if (ev.target.closest('.search-bar')) return;
        searchBar.classList.remove('active');
    });

    // Optional: on resize, ensure class state matches viewport
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) searchBar.classList.remove('active');
    });
}

// Universal search suggestion dropdown for all pages
function initUniversalSearchSuggestions() {
    // Disable universal search suggestions on the Disease Database page
    if (document.getElementById && document.getElementById('diseases-page')) return;
    const input = document.getElementById('search-input');
    if (!input) return;

    // Create or get the suggestion dropdown
    let sugg = document.getElementById('universal-suggestions');
    if (!sugg) {
        sugg = document.createElement('div');
        sugg.id = 'universal-suggestions';
        sugg.style.display = 'none';
        sugg.style.position = 'absolute';
        sugg.style.top = '100%';
        sugg.style.left = '0';
        sugg.style.width = '100%';
        sugg.style.background = '#fff';
        sugg.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
        sugg.style.borderRadius = '0 0 12px 12px';
        sugg.style.zIndex = '1001';
        sugg.style.maxHeight = '260px';
        sugg.style.overflowY = 'auto';
        sugg.style.fontSize = '1rem';
        input.parentNode.appendChild(sugg);
    }

    // Collect all searchable items on the page
    function getSearchList() {
        const medicines = Array.from(document.querySelectorAll('.medicine-card')).map(card => ({
            type: 'medicine',
            name: card.querySelector('.medicine-name')?.textContent?.trim() || '',
            subtitle: card.querySelector('.medicine-generic')?.textContent?.trim() || '',
            el: card
        }));

        const diseases = Array.from(document.querySelectorAll('.disease-info')).map(link => ({
            type: 'disease',
            name: link.textContent.replace(/[\n\r]/g, '').trim().replace(/^[▶▼•\s]+/, ''),
            subtitle: link.closest('.disease-category')?.querySelector('h3')?.textContent?.trim() || '',
            el: link
        }));

        const news = Array.from(document.querySelectorAll('.news-card')).map(card => ({
            type: 'news',
            name: card.querySelector('h3')?.textContent?.trim() || '',
            subtitle: card.querySelector('.news-date')?.textContent?.trim() || '',
            el: card
        }));

        return [...medicines, ...diseases, ...news];
    }

    let selIdx = -1;
    let lastResults = [];

    input.addEventListener('input', function() {
        const q = this.value.trim().toLowerCase();
        if (!q) { sugg.style.display = 'none'; sugg.innerHTML = ''; return; }
        const list = getSearchList();
        const matches = list.filter(item => 
            item.name.toLowerCase().includes(q) || 
            item.subtitle.toLowerCase().includes(q)
        );
        lastResults = matches;
        selIdx = -1;
        if (!matches.length) { sugg.style.display = 'none'; sugg.innerHTML = ''; return; }
        sugg.innerHTML = matches.map((item, i) => {
            let icon = item.type === 'medicine' ? '<i class="fas fa-pills" style="color:#2563eb;margin-right:8px;"></i>'
                : item.type === 'disease' ? '<i class="fas fa-stethoscope" style="color:#10b981;margin-right:8px;"></i>'
                : '<i class="fas fa-newspaper" style="color:#64748b;margin-right:8px;"></i>';
            return `
                <div class="universal-suggestion-item" data-idx="${i}" style="padding:10px 18px;cursor:pointer;border-bottom:1px solid #e2e8f0;">
                    <div style="display:flex;align-items:center;">
                        ${icon}
                        <div>
                            <div style="font-weight:500;">${item.name}</div>
                            ${item.subtitle ? `<div style="font-size:0.85em;color:var(--gray);margin-top:2px;">${item.subtitle}</div>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        sugg.style.display = 'block';
    });

    sugg.addEventListener('mousedown', function(e) {
        const item = e.target.closest('.universal-suggestion-item');
        if (!item) return;
        const idx = parseInt(item.getAttribute('data-idx'), 10);
        const match = lastResults[idx];
        if (match && match.el) {
            // Scroll to and highlight the element
            match.el.scrollIntoView({behavior:'smooth',block:'center'});
            match.el.classList.add('highlight');
            setTimeout(()=>match.el.classList.remove('highlight'), 1200);
            // Optionally, focus or open details if it's a disease link — trigger a double-click programmatically
            if (match.type === 'disease' && match.el) {
                try {
                    match.el.dispatchEvent(new MouseEvent('dblclick', {bubbles:true, cancelable:true}));
                } catch (err) {
                    // Fallback to click if dblclick cannot be dispatched
                    if (typeof match.el.click === 'function') match.el.click();
                }
            }
        }
        sugg.style.display = 'none';
        input.value = match ? match.name : '';
        e.preventDefault();
    });

    // Hide suggestions on blur (with delay for click)
    input.addEventListener('blur', ()=>setTimeout(()=>{sugg.style.display='none';},120));

    // Keyboard navigation
    input.addEventListener('keydown', function(e) {
        const items = sugg.querySelectorAll('.universal-suggestion-item');
        if (!items.length || sugg.style.display !== 'block') return;
        if (e.key === 'ArrowDown') {
            selIdx = (selIdx+1) % items.length;
            items.forEach((it,i)=>it.style.background=i===selIdx?'#e0e7ff':'');
            e.preventDefault();
        } else if (e.key === 'ArrowUp') {
            selIdx = (selIdx-1+items.length)%items.length;
            items.forEach((it,i)=>it.style.background=i===selIdx?'#e0e7ff':'');
            e.preventDefault();
        } else if (e.key === 'Enter' && selIdx>=0) {
            items[selIdx].dispatchEvent(new MouseEvent('mousedown'));
            selIdx = -1;
            e.preventDefault();
        }
    });
}

// Add this after initWelcomeAlert()
function initLegalModals() {
    const modalOverlay = document.getElementById('modal-overlay');
    const modalTitle = document.getElementById('modal-title');
    const modalBody = document.getElementById('modal-body');
    const modalClose = document.getElementById('modal-close');

    // Modal content
    const modalContent = {
        'editorial-policy': {
            title: 'Editorial Policy',
            content: `
                <h3 style="color:var(--primary);margin-bottom:16px;">Content Development & Review</h3>
                <p>Our editorial process ensures accuracy and reliability through:</p>
                <ul style="margin:12px 0;padding-left:20px;">
                    <li>Systematic review by medical experts</li>
                    <li>Regular updates based on latest clinical evidence</li>
                    <li>Strict compliance with medical guidelines</li>
                    <li>Independent verification of drug information</li>
                </ul>

                <h3 style="color:var(--primary);margin:20px 0 16px;">Editorial Independence</h3>
                <p>We maintain strict editorial independence from commercial interests. Our content is:</p>
                <ul style="margin:12px 0;padding-left:20px;">
                    <li>Written and reviewed by healthcare professionals</li>
                    <li>Based on peer-reviewed medical literature</li>
                    <li>Free from pharmaceutical company influence</li>
                    <li>Regularly audited for accuracy</li>
                </ul>

                <p style="margin-top:20px;font-style:italic;color:var(--gray);">Last updated: January 2025</p>
            `
        },
        'advertise': {
            title: 'Advertise With Us',
            content: `
                <h3 style="color:var(--primary);margin-bottom:16px;">Reach Healthcare Professionals</h3>
                <p>Connect with our audience of healthcare providers, including:</p>
                <ul style="margin:12px 0;padding-left:20px;">
                    <li>Physicians and Specialists</li>
                    <li>Pharmacists</li>
                    <li>Medical Residents and Students</li>
                    <li>Healthcare Organizations</li>
                </ul>

                <h3 style="color:var(--primary);margin:20px 0 16px;">Advertising Options</h3>
                <div style="background:var(--light);padding:16px;border-radius:8px;margin:12px 0;">
                    <h4 style="color:var(--dark);margin-bottom:8px;">Digital Advertising</h4>
                    <ul style="margin:8px 0;padding-left:20px;">
                        <li>Website Display Ads</li>
                        <li>Newsletter Sponsorship</li>
                        <li>Sponsored Content</li>
                    </ul>
                </div>

                <p style="margin-top:20px;">
                    For advertising inquiries, contact us at:<br>
                    <strong>Email:</strong> advertising@mimsph.com<br>
                    <strong>Phone:</strong> (555) 123-4567
                </p>
            `
        }
    };

    // Handle link clicks
    document.querySelectorAll('.footer-links a').forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') {
                e.preventDefault();
                const type = this.textContent.trim().toLowerCase().includes('policy') ? 'editorial-policy' : 'advertise';
                const content = modalContent[type];
                if (content) {
                    modalTitle.textContent = content.title;
                    modalBody.innerHTML = content.content;
                    modalOverlay.style.display = 'block';
                    // Prevent body scroll when modal is open
                    document.body.style.overflow = 'hidden';
                }
            }
        });
    });

    // Close modal
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            modalOverlay.style.display = 'none';
            document.body.style.overflow = '';
        });
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });

        // Close on ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modalOverlay.style.display === 'block') {
                modalOverlay.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    }
}

// Add to main initialization
(function(){
    // External navigation handler
    document.addEventListener('click', function(e) {
        const a = e.target.closest && e.target.closest('a');
        if (!a) return;

        const href = a.getAttribute('href') || '';

        if (a.dataset && a.dataset.external === 'true') {
            e.stopImmediatePropagation();
            return;
        }
        if (a.target === '_blank') {
            e.stopImmediatePropagation();
            return;
        }
        if (/^https?:\/\//i.test(href)) {
            e.stopImmediatePropagation();
            return;
        }
        if (href && /\.html(\b|$)/i.test(href)) {
            e.stopImmediatePropagation();
            return;
        }
    }, true);

    // Page navigation
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            if (this.hasAttribute('data-external') || 
                (this.getAttribute('href') && this.getAttribute('href').endsWith('.html'))) {
                return;
            }
            const page = this.dataset.page;
            if (!page) return;
            e.preventDefault();
            
            document.querySelectorAll('.page-section').forEach(sec => 
                sec.classList.remove('active')
            );
            const target = document.getElementById(page + '-page');
            if (target) target.classList.add('active');
            
            document.querySelector('.nav-menu')?.classList.remove('open');
        });
    });

    // Mobile menu
    const mobileBtn = document.querySelector('.mobile-menu-btn');
    const navMenu = document.querySelector('.nav-menu');
    if (mobileBtn && navMenu) {
        mobileBtn.addEventListener('click', () => navMenu.classList.toggle('open'));
    }

    // Responsive search behavior
    initResponsiveSearch();

    // Universal search suggestion dropdown for all pages
    initUniversalSearchSuggestions();

    // Welcome alert
    initWelcomeAlert();

    // Tool modal
    initToolModal();

    // Drug interactions checker
    initInteractionChecker();

    // Alphabet filter & search
    initMedicineFilters();

    // Short utility and UI handlers for Clinical Tools
    initToolSystem();

    // Disease popup initialization
    initDiseasePopup();

    // Disease suggestion dropdown for Disease Database page
    initDiseaseSuggestionDropdown();

    // Legal modals for Editorial Policy and Advertise With Us
    initLegalModals();
})();

// Helper functions
function initWelcomeAlert() {
    const container = document.getElementById('welcome-alert');
    const text = document.getElementById('welcome-text');
    const close = document.getElementById('close-welcome');
    
    try {
        const dismissed = localStorage.getItem('mims_welcome_dismissed');
        if (!dismissed && container && text) {
            const hour = new Date().getHours();
            let greeting = 'Welcome to MIMS ph — Trusted Medical Information';
            if (hour < 12) greeting = 'Good morning — Welcome to MIMS ph';
            else if (hour < 18) greeting = 'Good afternoon — Welcome to MIMS ph';
            text.textContent = greeting + '. This site is intended for healthcare professionals.';
            container.style.display = 'block';
        }
        if (close) {
            close.addEventListener('click', () => {
                container.style.display = 'none';
                try { localStorage.setItem('mims_welcome_dismissed', '1'); } catch(e){}
            });
        }
    } catch(e){}
}

function initToolModal() {
    const modal = document.getElementById('tool-modal');
    const title = document.getElementById('tool-title');
    const subtitle = document.getElementById('tool-subtitle');
    const body = document.getElementById('tool-body');
    const close = document.getElementById('tool-close');

    // Tool opening handlers
    document.querySelectorAll('.open-tool-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            openTool(tool, modal, title, subtitle, body);
        });
    });

    // Close handlers
    if (close) close.addEventListener('click', () => closeToolModal(modal));
    
    // ESC key handler
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal && modal.classList.contains('open')) {
            closeToolModal(modal);
        }
    });
}

function initInteractionChecker() {
    const checkBtn = document.getElementById('check-interaction-btn');
    if (!checkBtn) return;

    checkBtn.addEventListener('click', () => {
        const drug1 = document.getElementById('drug1-select').value;
        const drug2 = document.getElementById('drug2-select').value;

        if (!drug1 || !drug2) {
            alert('Please select both medications');
            return;
        }

        if (drug1 === drug2) {
            alert('Please select two different medications');
            return;
        }

        checkInteraction(drug1, drug2);
    });
}

function initMedicineFilters() {
    const cards = Array.from(document.querySelectorAll('.medicine-card'));
    const alphaBtns = Array.from(document.querySelectorAll('.alphabet-btn'));
    const dbFilters = Array.from(document.querySelectorAll('.db-filter'));
    const searchInput = document.getElementById('search-input');
    
    let activeLetter = 'all';
    let activeView = 'all';

    function isGenericCard(card) {
        // Prefer explicit marker when available
        const dt = (card.getAttribute('data-type') || '').toLowerCase();
        if (dt === 'generic') return true;
        if (dt === 'brand') return false;

        // Fallback heuristic: inspect the "medicine-generic" text
        const genText = (card.querySelector('.medicine-generic')?.textContent || '').trim().toLowerCase();
        const nameText = (card.querySelector('.medicine-name')?.textContent || '').trim().toLowerCase();

        // If generic field equals the displayed name, treat as generic entry
        if (genText && nameText && genText === nameText) return true;

        // If generic field contains common generic-word markers or is a single simple token, treat as generic
        const genericMarkers = ['hydrochloride','sodium','trihydrate','acetate','phosphate','cilexetil','potassium','calcium','maleate','tartrate'];
        for (const m of genericMarkers) if (genText.includes(m)) return true;

        // If generic field explicitly mentions 'common brand' treat as generic (existing pattern)
        if (genText.includes('common brand') || genText.includes('common brands')) return true;

        // Otherwise assume brand (conservative default)
        return false;
    }

    function applyFilters() {
        cards.forEach(card => {
            const cardLetter = (card.getAttribute('data-letter') || '').toUpperCase();
            const matchesLetter = (activeLetter === 'all' || cardLetter === activeLetter.toUpperCase());
            
            const genericFlag = isGenericCard(card);
            
            let matchesView = true;
            if (activeView === 'brand') matchesView = !genericFlag;
            else if (activeView === 'generic') matchesView = genericFlag;
            
            card.style.display = (matchesLetter && matchesView) ? 'block' : 'none';
        });
    }

    // Alphabet filter
    if (alphaBtns.length) {
        alphaBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                alphaBtns.forEach(b => b.classList.remove('active'));
                this.classList.add('active');
                activeLetter = this.getAttribute('data-letter') || 'all';
                applyFilters();
                if (searchInput) searchInput.value = '';
            });
        });
    }

    // Database view filters (from dropdown and in-page controls)
    if (dbFilters.length) {
        dbFilters.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                dbFilters.forEach(l => l.classList.remove('active'));
                this.classList.add('active');
                activeView = this.getAttribute('data-view') || 'all';
                applyFilters();
                
                // Update the page heading to reflect the current view
                const viewText = activeView === 'brand' ? 'Brand Name Medicines' : 
                               activeView === 'generic' ? 'Generic Medicines' : 
                               'A-Z Medicine Database';
                const title = document.querySelector('.section-title');
                if (title) title.textContent = viewText + ' (Philippines)';
            });
        });
    }

    // Search filter
    if (searchInput) {
        let timer;
        searchInput.addEventListener('input', () => {
            clearTimeout(timer);
            timer = setTimeout(() => {
                searchMedicines(searchInput.value, cards, alphaBtns);
            }, 180);
        });
    }

    // Show all on initial load
    const allAlphaBtn = document.querySelector('.alphabet-btn[data-letter="all"]');
    if (allAlphaBtn) allAlphaBtn.click();
}

// Short utility and UI handlers for Clinical Tools
function initToolSystem() {
    function calculateBMI() {
        const weight = parseFloat(document.getElementById('bmi-weight')?.value);
        const height = parseFloat(document.getElementById('bmi-height')?.value);
        const resultDiv = document.getElementById('bmi-result');
        if (!weight || !height) {
            resultDiv.textContent = 'Please enter both weight and height.';
            return;
        }
        const bmi = weight / ((height/100) * (height/100));
        const category = bmi < 18.5 ? 'Underweight' : bmi < 25 ? 'Normal' : bmi < 30 ? 'Overweight' : 'Obese';
        resultDiv.innerHTML = `BMI: <strong>${bmi.toFixed(1)}</strong> — ${category}`;
    }

    // Make calculator functions globally available
    window.calculateBMI = calculateBMI;
}

function getToolConfig(toolId) {
    const commonInputStyle = 'width:100%;padding:12px;margin:8px 0;border:1px solid #e2e8f0;border-radius:8px;font-size:1rem;';
    const commonButtonStyle = 'width:100%;padding:12px;background:#2563eb;color:white;border:none;border-radius:8px;font-size:1rem;font-weight:500;cursor:pointer;margin-top:16px;';
    const resultStyle = 'margin-top:20px;padding:16px;border-radius:8px;background:#f8fafc;';

    switch(toolId) {
        case 'bmi':
            return {
                title: 'BMI Calculator',
                subtitle: 'Calculate Body Mass Index',
                html: `
                    <div class="calculator-container">
                        <div class="input-group">
                            <label for="bmi-weight">Weight (kg)</label>
                            <input type="number" id="bmi-weight" placeholder="Enter weight" style="${commonInputStyle}">
                        </div>
                        <div class="input-group">
                            <label for="bmi-height">Height (cm)</label>
                            <input type="number" id="bmi-height" placeholder="Enter height" style="${commonInputStyle}">
                        </div>
                        <button onclick="calculateBMI()" style="${commonButtonStyle}">Calculate BMI</button>
                        <div id="bmi-result" style="${resultStyle}"></div>
                    </div>
                `
            };

        case 'egfr':
            return {
                title: 'eGFR Calculator',
                subtitle: 'Estimate Glomerular Filtration Rate',
                html: `
                    <div class="calculator-container">
                        <div class="input-group">
                            <label for="egfr-age">Age (years)</label>
                            <input type="number" id="egfr-age" placeholder="Enter age" style="${commonInputStyle}">
                        </div>
                        <div class="input-group">
                            <label>Sex</label>
                            <select id="egfr-sex" style="${commonInputStyle}">
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                        </div>
                        <div class="input-group">
                            <label for="egfr-scr">Serum Creatinine (mg/dL)</label>
                            <input type="number" id="egfr-scr" step="0.1" placeholder="Enter creatinine" style="${commonInputStyle}">
                        </div>
                        <div class="input-group">
                            <label>Race</label>
                            <select id="egfr-race" style="${commonInputStyle}">
                                <option value="non-black">Non-Black</option>
                                <option value="black">Black</option>
                            </select>
                        </div>
                        <button onclick="calculateEGFR()" style="${commonButtonStyle}">Calculate eGFR</button>
                        <div id="egfr-result" style="${resultStyle}"></div>
                    </div>
                `
            };
        // Add more tools as needed...
    }
}

function attachToolHandlers(toolId, container) {
    if (toolId === 'bmi') {
        window.calculateBMI = function() {
            const weight = parseFloat(document.getElementById('bmi-weight').value);
            const height = parseFloat(document.getElementById('bmi-height').value);
            const resultDiv = document.getElementById('bmi-result');
            
            if (!weight || !height) {
                resultDiv.innerHTML = '<div class="alert alert-warning">Please enter both weight and height.</div>';
                return;
            }

            const bmi = weight / Math.pow(height/100, 2);
            let category, color;

            if (bmi < 18.5) {
                category = 'Underweight';
                color = '#eab308'; // yellow
            } else if (bmi < 25) {
                category = 'Normal';
                color = '#22c55e'; // green
            } else if (bmi < 30) {
                category = 'Overweight';
                color = '#f97316'; // orange
            } else {
                category = 'Obese';
               
            }

            resultDiv.innerHTML = `
                <div style="text-align:center;padding:12px;">
                    <div style="font-size:2rem;font-weight:600;color:${color};">${bmi.toFixed(1)}</div>
                    <div style="font-size:1.1rem;margin-top:8px;">${category}</div>
                    <div style="font-size:0.9rem;color:#64748b;margin-top:4px;">kg/m²</div>
                </div>
            `;
        };
    }
    // Add more calculator handlers...
}

document.addEventListener('DOMContentLoaded', function() {
    // (Disease suggestion dropdown removed)


		function getDataFor(key){
			return diseaseData[key] || {
				title: key.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),
				description: "Detailed description not available.",
				causes: "Causes not available.",
				symptoms: "Symptoms not available."
			};
		}

		function showPopupFor(key, anchorEl){
			const data = getDataFor(key);
			popupTitle.textContent = data.title;
			popupBody.innerHTML = "<strong>Description:</strong><div style='margin:6px 0 10px 0;'>"+escapeHtml(data.description)+"</div>"
								+ "<strong>Causes:</strong><div style='margin:6px 0 10px 0;'>"+escapeHtml(data.causes)+"</div>"
								+ "<strong>Symptoms:</strong><div style='margin:6px 0 0 0;'>"+escapeHtml(data.symptoms)+"</div>";

			// render popup off-screen / hidden so we can measure its real size
			popup.style.display = 'block';
			popup.style.visibility = 'hidden';
			popup.style.opacity = '0';
			popup.classList.add('show');

			// Position after it's rendered
			requestAnimationFrame(() => {
				const rect = anchorEl.getBoundingClientRect();
				const popupRect = popup.getBoundingClientRect();
				const margin = 8;
				let left = rect.left + window.scrollX;
				if (left + popupRect.width + margin > window.scrollX + window.innerWidth) {
					left = window.scrollX + window.innerWidth - popupRect.width - margin;
				}
				if (left < window.scrollX + margin) left = window.scrollX + margin;

				let top = rect.bottom + window.scrollY + 6;
				if (top + popupRect.height + margin > window.scrollY + window.innerHeight) {
					top = rect.top + window.scrollY - popupRect.height - 6;
					if (top < window.scrollY + margin) {
						top = window.scrollY + (window.innerHeight - popupRect.height)/2;
						left = window.scrollX + (window.innerWidth - popupRect.width)/2;
					}
				}

				popup.style.left = Math.round(left) + "px";
				popup.style.top = Math.round(top) + "px";

				// reveal popup smoothly
				popup.style.visibility = '';
				requestAnimationFrame(()=> popup.style.opacity = '1');
			});
		}

		function hidePopup(){
			if (!popup) return;
			popup.classList.remove('show');
			popup.style.opacity = '0';
			setTimeout(()=>{ if (popup.style.opacity === '0') popup.style.display = 'none'; }, 200);
		}

        // Expose popup functions globally so other handlers or delegated listeners can call them
        window.showPopupFor = showPopupFor;
        window.hidePopup = hidePopup;

		function escapeHtml(str){
			return String(str).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; });
		}

        document.querySelectorAll('.disease-info').forEach(link=>{
            // Prevent default single-click navigation (anchors with href="#" jump to top)
            link.addEventListener('click', function(e){
                e.preventDefault();
                // Stop other click handlers or delegated listeners from running
                e.stopImmediatePropagation();
                return false;
            });

            // Only open the popup on double-click; single-click does not open details
            link.addEventListener('dblclick', function(e){
                e.preventDefault();
                const key = this.getAttribute('data-disease') || '';
                showPopupFor(key, this);
            });
        });

        if (popupClose) popupClose.addEventListener('click', hidePopup);
        document.addEventListener('mousedown', function(e){
            if (!popup.contains(e.target) && !e.target.closest('.disease-info')) hidePopup();
        });
        document.addEventListener('keydown', function(e){ if (e.key === 'Escape') hidePopup(); });

    });

// Delegated click handler removed: details open only on double-click now.
// Keep a delegated dblclick listener to support dynamically added links.
document.addEventListener('dblclick', function(e){
    const link = e.target.closest && e.target.closest('.disease-info');
    if (!link) return;
    e.preventDefault();
    const key = link.getAttribute('data-disease') || '';
    if (typeof window.showPopupFor === 'function') {
        try { window.showPopupFor(key, link); } catch(err){ console.error(err); }
    }
});