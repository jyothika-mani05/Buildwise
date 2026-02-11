document.addEventListener('DOMContentLoaded', () => {
    // === VIEW SWITCHING ===
    window.switchView = function (viewName) {
        const landing = document.getElementById('landing-view');
        const app = document.getElementById('app-view');

        if (viewName === 'app') {
            landing.classList.add('hidden');
            app.classList.remove('hidden');
        } else {
            app.classList.add('hidden');
            landing.classList.remove('hidden');
        }
    };

    // === FORM STEPS ===
    const step1 = document.getElementById('step-1');
    const step2 = document.getElementById('step-2');

    window.nextStep = function () {
        // Validate Step 1
        const area = document.getElementById('area').value;
        if (!area || area < 200) { alert("Please enter a valid area (min 200 sq ft)."); return; }

        step1.classList.add('hidden');
        step2.classList.remove('hidden');
    };


    window.prevStep = function () {
        step2.classList.add('hidden');
        step1.classList.remove('hidden');
    };

    // === TABS ===
    window.openTab = function (tabName) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));

        // Show specific tab
        document.getElementById(`tab-${tabName}`).classList.add('active');

        // Highlight logic
        const clickedBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn => btn.textContent.toLowerCase().includes(tabName));
        if (clickedBtn) clickedBtn.classList.add('active');
    };

    // === FORM SUBMISSION ===
    const form = document.getElementById('plan-form');
    const overlay = document.getElementById('loading-overlay');
    const loadingText = document.getElementById('loading-text');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Show Overlay
        overlay.classList.remove('hidden');

        // Cycle Text
        const texts = ["Analyzing project dimensions...", "Checking regional rates...", "Optimizing workforce...", "Finalizing blueprint..."];
        let textIdx = 0;
        const interval = setInterval(() => {
            loadingText.textContent = texts[textIdx % texts.length];
            textIdx++;
        }, 1200);

        // Gather Data
        const formData = {
            area: document.getElementById('area').value,
            floors: document.getElementById('floors').value,
            type: document.getElementById('type').value,
            budget: document.getElementById('budget-pref').value,
            timeline: document.getElementById('time-pref').value,
            country: document.getElementById('country').value,
            currency: document.getElementById('currency').value
        };

        try {
            const response = await fetch('https://buildwise-e1eo.onrender.com/api/calculate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            // Populate Data
            updateDashboard(data);

            // Switch to Results (Tab 1)
            openTab('overview');

        } catch (error) {
            console.error(error);
            alert("Error generating plan. Please check console.");
        } finally {
            clearInterval(interval);
            overlay.classList.add('hidden');
        }
    });

    function updateDashboard(data) {
        document.getElementById('summary-text').textContent = data.summary || "No summary provided.";

        // Currency Symbol Map
        const currencySymbols = {
            'INR': '₹',
            'USD': '$',
            'EUR': '€',
            'GBP': '£'
        };
        const cur = currencySymbols[data.currency] || data.currency + ' ';

        // Cost
        if (data.summary_breakdown) {
            document.getElementById('total-cost').textContent = cur + (data.total_estimated_cost || 0).toLocaleString();
            document.getElementById('cost-material').textContent = cur + (data.summary_breakdown.material || 0).toLocaleString();
            document.getElementById('cost-labor').textContent = cur + (data.summary_breakdown.labor || 0).toLocaleString();
            document.getElementById('cost-other').textContent = cur + (data.summary_breakdown.other || 0).toLocaleString();
        } else if (data.cost_breakdown) {
            // Fallback for old structure
            document.getElementById('total-cost').textContent = cur + (data.cost_breakdown.total || 0).toLocaleString();
            document.getElementById('cost-material').textContent = cur + (data.cost_breakdown.material || 0).toLocaleString();
            document.getElementById('cost-labor').textContent = cur + (data.cost_breakdown.labor || 0).toLocaleString();
            document.getElementById('cost-other').textContent = cur + (data.cost_breakdown.other || 0).toLocaleString();
        }

        // Populate Material Table
        const matTable = document.getElementById('material-table-body');
        matTable.innerHTML = '';
        let totalMatCheck = 0;
        if (data.material_cost_breakdown) {
            for (const [item, cost] of Object.entries(data.material_cost_breakdown)) {
                const row = `<tr>
                    <td style="text-transform: capitalize;">${item.replace(/_/g, ' ')}</td>
                    <td>${cur}${cost.toLocaleString()}</td>
                </tr>`;
                matTable.innerHTML += row;
                totalMatCheck += cost;
            }
            document.getElementById('mat-table-total').textContent = cur + totalMatCheck.toLocaleString();
        }

        // Populate Labor Table
        const labTable = document.getElementById('labor-table-body');
        labTable.innerHTML = '';
        if (data.labor_breakdown) {
            const skilled = data.labor_breakdown.skilled;
            const unskilled = data.labor_breakdown.unskilled;

            const rows = `
                <tr>
                    <td>Skilled</td>
                    <td>${skilled.workforce} workers</td>
                    <td>${skilled.duration} days</td>
                    <td>${cur}${skilled.daily_wage}</td>
                    <td>${cur}${skilled.total_cost.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Unskilled</td>
                    <td>${unskilled.workforce} workers</td>
                    <td>${unskilled.duration} days</td>
                    <td>${cur}${unskilled.daily_wage}</td>
                    <td>${cur}${unskilled.total_cost.toLocaleString()}</td>
                </tr>
            `;
            labTable.innerHTML = rows;

            document.getElementById('lab-total-workers').textContent = data.labor_breakdown.total_workforce + " Workers";
            document.getElementById('lab-total-days').textContent = data.labor_breakdown.total_days + " Days";
            document.getElementById('lab-table-total').textContent = cur + data.labor_breakdown.total_labor_cost.toLocaleString();
        }


        // Materials
        if (data.materials) {
            document.getElementById('mat-cement').textContent = (data.materials.cement || 0) + " bags";
            document.getElementById('mat-steel').textContent = (data.materials.steel || 0) + " kg";
            document.getElementById('mat-sand').textContent = (data.materials.sand || 0) + " tons";
            document.getElementById('mat-bricks').textContent = (data.materials.bricks || 0) + " pcs";
        }

        // Workforce
        document.getElementById('worker-text').textContent = data.workers_per_day || "N/A";

        // Timeline
        document.getElementById('total-weeks').textContent = (data.timeline_weeks || 0) + " WEEKS";
        const timelineList = document.getElementById('timeline-list');
        timelineList.innerHTML = '';
        if (data.schedule_phases) {
            data.schedule_phases.forEach(phase => {
                const item = document.createElement('div');
                item.className = 'phase-item';

                // Format Weeks
                let weekDisplay = "";
                if (phase.start_week && phase.end_week) {
                    if (phase.start_week === phase.end_week) {
                        weekDisplay = `WEEK ${phase.start_week}`;
                    } else {
                        weekDisplay = `WEEKS ${phase.start_week} - ${phase.end_week}`;
                    }
                } else if (phase.weeks) {
                    // Fallback for old cached calls
                    weekDisplay = `WEEK ${phase.weeks}`;
                }

                item.innerHTML = `
                    <span class="phase-weeks">${weekDisplay}</span>
                    <div class="phase-name">${phase.phase}</div>
                    <div class="phase-desc">${phase.description}</div>
                `;
                timelineList.appendChild(item);
            });
        }

        // Risks
        const risksList = document.getElementById('risks-list');
        risksList.innerHTML = '';
        if (data.risks) {
            data.risks.forEach(r => {
                const li = document.createElement('li');
                li.textContent = r;
                risksList.appendChild(li);
            });
        }

        // Optimizations
        const optsList = document.getElementById('opts-list');
        optsList.innerHTML = '';
        if (data.optimizations) {
            data.optimizations.forEach(o => {
                const li = document.createElement('li');
                li.textContent = o;
                optsList.appendChild(li);
            });
        }
    }

    // === REPORT GENERATION ===
    const downloadBtn = document.querySelector('.btn-download');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', generatePDF);
    }

    function generatePDF() {
        // Feedback to user
        const originalText = downloadBtn.textContent;
        downloadBtn.textContent = "Generating...";

        const element = document.getElementById('report-template');

        // Populate Report Data (grab from current DOM or cached data)
        document.getElementById('rep-date').textContent = new Date().toLocaleDateString();
        document.getElementById('rep-type').textContent = document.getElementById('type').value;
        document.getElementById('rep-area').textContent = document.getElementById('area').value + " SQ FT";

        document.getElementById('rep-summary').textContent = document.getElementById('summary-text').textContent;
        document.getElementById('rep-total').textContent = document.getElementById('total-cost').textContent;
        document.getElementById('rep-mat-cost').textContent = document.getElementById('cost-material').textContent;
        document.getElementById('rep-lab-cost').textContent = document.getElementById('cost-labor').textContent;

        document.getElementById('rep-duration').textContent = document.getElementById('total-weeks').textContent;
        document.getElementById('rep-workers').textContent = document.getElementById('worker-text').textContent;

        document.getElementById('rep-cement').textContent = document.getElementById('mat-cement').textContent;
        document.getElementById('rep-steel').textContent = document.getElementById('mat-steel').textContent;
        document.getElementById('rep-sand').textContent = document.getElementById('mat-sand').textContent;
        document.getElementById('rep-bricks').textContent = document.getElementById('mat-bricks').textContent;

        // Clone Detailed Tables
        document.getElementById('rep-mat-table-body').innerHTML = document.getElementById('material-table-body').innerHTML;
        document.getElementById('rep-lab-table-body').innerHTML = document.getElementById('labor-table-body').innerHTML;

        // Clone timeline
        const repTimeline = document.getElementById('rep-timeline-list');
        repTimeline.innerHTML = document.getElementById('timeline-list').innerHTML;

        // Configurations
        const opt = {
            margin: 0.5,
            filename: 'BuildWise_Plan.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Temporarily show for rendering
        element.style.display = 'block';

        html2pdf().set(opt).from(element).save().then(() => {
            element.style.display = 'none';
            downloadBtn.textContent = originalText;
        }).catch(err => {
            console.error(err);
            alert("Error generating PDF. Check console.");
            downloadBtn.textContent = originalText;
            element.style.display = 'none';
        });
    }
});

/* === AUTH MODAL LOGIC === */
function openModal(mode) {
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('hidden');
    switchAuthTab(mode);
}

function closeModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

// Close on background click
document.getElementById('auth-modal').addEventListener('click', (e) => {
    if (e.target.id === 'auth-modal') closeModal();
});

function switchAuthTab(mode) {
    const loginForm = document.getElementById('form-login');
    const signupForm = document.getElementById('form-signup');
    const loginTab = document.getElementById('tab-login');
    const signupTab = document.getElementById('tab-signup');

    if (mode === 'login') {
        loginForm.classList.remove('hidden');
        signupForm.classList.add('hidden');
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
    } else {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
        loginTab.classList.remove('active');
        signupTab.classList.add('active');
    }
}

async function handleLogin(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const errorMsg = document.getElementById('login-error');
    const btn = form.querySelector('button');

    // Reset
    errorMsg.classList.add('hidden');
    btn.disabled = true;
    btn.textContent = "Verifying...";

    try {
        const response = await fetch('/login', {
            method: 'POST',
            body: formData
        });

        // Handle HTML redirect vs JSON response
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
            const data = await response.json();
            if (response.ok) {
                // Success - Reload to enter dashboard
                window.location.reload();
            } else {
                throw new Error(data.error || "Login failed");
            }
        } else {
            // Fallback for non-JSON responses (legacy)
            if (response.redirected && response.url.includes('/')) {
                window.location.href = response.url;
            } else {
                throw new Error("Invalid credentials");
            }
        }

    } catch (err) {
        errorMsg.textContent = err.message;
        errorMsg.classList.remove('hidden');
        btn.textContent = "Access Dashboard →";
    } finally {
        btn.disabled = false;
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const form = e.target;
    // For now, just simulate signup and tell user to login
    const btn = form.querySelector('button');
    btn.textContent = "Creating Account...";
    btn.disabled = true;

    await new Promise(r => setTimeout(r, 1000)); // Fake delay

    alert("Account created successfully! Please login.");
    switchAuthTab('login');
    btn.disabled = false;
    btn.textContent = "Create Account →";
}
