/**
 * Initialize dark mode functionality
 */
function initDarkMode() {
  // Create dark mode toggle
  createDarkModeToggle();

  // Check user's preference
  const prefersDark =
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');

  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
    document.getElementById('dark-mode-toggle').checked = true;
  }

  // Listen for changes in system preference
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', e => {
      if (!localStorage.getItem('theme')) {
        if (e.matches) {
          document.body.classList.add('dark-mode');
          document.getElementById('dark-mode-toggle').checked = true;
        } else {
          document.body.classList.remove('dark-mode');
          document.getElementById('dark-mode-toggle').checked = false;
        }
      }
    });
}

/**
 * Create dark mode toggle in the navbar
 */
function createDarkModeToggle() {
  const container = document.getElementById('darkModeContainer');

  // Create switch container
  const label = document.createElement('label');
  label.className = 'switch';

  // Create toggle input
  const input = document.createElement('input');
  input.type = 'checkbox';
  input.id = 'dark-mode-toggle';

  // Create slider
  const span = document.createElement('span');
  span.className = 'slider round';

  // Add event listener
  input.addEventListener('change', function () {
    if (this.checked) {
      document.body.classList.add('dark-mode');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      localStorage.setItem('theme', 'light');
    }
  });

  // Append elements
  label.appendChild(input);
  label.appendChild(span);

  // Add icon and label
  const darkModeLabel = document.createElement('div');
  darkModeLabel.style.display = 'flex';
  darkModeLabel.style.alignItems = 'center';
  darkModeLabel.style.gap = '0.5rem';

  const icon = document.createElement('span');
  icon.innerHTML = '🌙';

  darkModeLabel.appendChild(icon);
  darkModeLabel.appendChild(label);

  container.appendChild(darkModeLabel);
}

/**
 * Initialize mobile navigation
 */
function initMobileNav() {
  createBottomNav();
}

/**
 * Create bottom navigation for mobile devices
 */
function createBottomNav() {
  const navContainer = document.getElementById('bottom-nav-container');

  // Create bottom nav
  const bottomNav = document.createElement('nav');
  bottomNav.className = 'bottom-nav';

  // Define nav items
  const navItems = [
    { icon: '📊', label: 'Dashboard', active: true, link: '/dashboard' },
    { icon: '📝', label: 'Transactions', active: false, link: '/transactions' },
    { icon: '🖼️', label: 'NFTs', active: false, link: '/nfts' },
    { icon: '⚙️', label: 'Settings', active: false, link: '/settings' },
  ];

  // Create items
  navItems.forEach(item => {
    const navItem = document.createElement('a');
    navItem.className = 'nav-item' + (item.active ? ' active' : '');
    navItem.href = item.link;

    const icon = document.createElement('span');
    icon.className = 'nav-icon';
    icon.textContent = item.icon;

    const label = document.createElement('span');
    label.className = 'nav-label';
    label.textContent = item.label;

    navItem.appendChild(icon);
    navItem.appendChild(label);
    bottomNav.appendChild(navItem);

    // Add click event
    navItem.addEventListener('click', function (e) {
      // If it's the dashboard, don't prevent default
      if (item.label !== 'Dashboard') {
        e.preventDefault();

        // Remove active class from all items
        document.querySelectorAll('.nav-item').forEach(item => {
          item.classList.remove('active');
        });

        // Add active class to clicked item
        navItem.classList.add('active');

        // Handle specific actions
        if (item.label === 'Transactions') {
          document.querySelector('[data-tab="transactions"]').click();
        } else if (item.label === 'NFTs') {
          document.querySelector('[data-tab="nfts"]').click();
        } else if (item.label === 'Settings') {
          document.querySelector('[data-tab="documents"]').click();
        }
      }
    });
  });

  navContainer.appendChild(bottomNav);
}

/**
 * Initialize pull-to-refresh functionality for mobile
 */
function initPullToRefresh() {
  let touchStartY = 0;
  let touchEndY = 0;
  let isRefreshing = false;

  // Create pull-to-refresh element
  const ptr = document.createElement('div');
  ptr.className = 'ptr-element';
  ptr.style.transform = 'translateY(-50px)';

  const spinner = document.createElement('div');
  spinner.className = 'ptr-refresh';
  ptr.appendChild(spinner);

  document.body.insertBefore(ptr, document.body.firstChild);

  // Handle touch events
  document.addEventListener(
    'touchstart',
    function (e) {
      touchStartY = e.touches[0].clientY;
    },
    { passive: true }
  );

  document.addEventListener(
    'touchmove',
    function (e) {
      if (window.scrollY === 0 && !isRefreshing) {
        touchEndY = e.touches[0].clientY;
        const distance = touchEndY - touchStartY;

        if (distance > 0 && distance < 100) {
          ptr.style.transform = `translateY(${distance - 50}px)`;
        }
      }
    },
    { passive: true }
  );

  document.addEventListener(
    'touchend',
    function () {
      if (window.scrollY === 0 && !isRefreshing) {
        const distance = touchEndY - touchStartY;

        if (distance > 70) {
          // Show the refreshing spinner
          ptr.style.transform = 'translateY(10px)';
          isRefreshing = true;

          // Refresh data
          fetchDashboardMetrics();

          // Current active tab
          const activeTab =
            document.querySelector('.tab-btn.active').dataset.tab;
          if (activeTab === 'transactions') {
            fetchTransactions();
          } else if (activeTab === 'nfts') {
            fetchNFTs();
          } else if (activeTab === 'mev-detection') {
            fetchMevDetections();
          }

          // Show a toast
          showToast('Refreshing data...', 'info');

          // Hide the refreshing spinner after 1 second
          setTimeout(() => {
            ptr.style.transform = 'translateY(-50px)';
            isRefreshing = false;
          }, 1000);
        } else {
          // Reset position
          ptr.style.transform = 'translateY(-50px)';
        }
      }
    },
    { passive: true }
  );
}

/**
 * Initialize responsive tables
 */
function initResponsiveTables() {
  // Wrap all tables with a responsive container
  document.querySelectorAll('table').forEach(table => {
    if (!table.parentElement.classList.contains('responsive-table')) {
      const wrapper = document.createElement('div');
      wrapper.className = 'responsive-table';
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    }
  });
}

/**
 * Simulate content loading with skeleton placeholders
 */
function loadContent() {
  // Show skeletons
  document.querySelectorAll('.skeleton-loader').forEach(skeleton => {
    skeleton.style.display = 'block';
  });

  // Hide skeletons after timeout
  setTimeout(() => {
    document.querySelectorAll('.skeleton-loader').forEach(skeleton => {
      skeleton.style.display = 'none';
    });
  }, 1500);
}

/**
 * Initialize toast notification system
 */
function initToasts() {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toast-container');

  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }
}

/**
 * Show a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, error, warning, info)
 * @param {string} title - Optional title for the toast
 * @param {number} duration - Duration in milliseconds
 */
function showToast(message, type = 'info', title = '', duration = 3000) {
  // Get container
  const container = document.getElementById('toast-container');

  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  // Toast content - using safe DOM manipulation to prevent XSS
  if (title) {
    const titleDiv = document.createElement('div');
    titleDiv.className = 'toast-title';
    titleDiv.textContent = title; // Safe text assignment
    toast.appendChild(titleDiv);
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = 'toast-message';
  messageDiv.textContent = message; // Safe text assignment
  toast.appendChild(messageDiv);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.className = 'toast-close';
  closeBtn.textContent = '×'; // Safe text assignment
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });

  toast.appendChild(closeBtn);

  // Add to container
  container.appendChild(toast);

  // Auto remove after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
}

/**
 * Initialize MEV protection dashboard
 */
function initMevProtection() {
  // Set up event listeners for MEV protection settings
  document
    .querySelectorAll('.mev-settings input[type="checkbox"]')
    .forEach(checkbox => {
      checkbox.addEventListener('change', function () {
        loadMevStats();
      });
    });

  // Initial stats load
  loadMevStats();
}

/**
 * Load MEV protection statistics
 */
function loadMevStats() {
  // This would normally fetch data from the API
  // For now, we'll simulate it
  simulateSettingUpdate(
    'fair-ordering',
    document.getElementById('fair-ordering').checked
  );
  simulateSettingUpdate(
    'tx-batching',
    document.getElementById('tx-batching').checked
  );
  simulateSettingUpdate(
    'fee-caps',
    document.getElementById('fee-caps').checked
  );
}

/**
 * Simulate updating a setting on the server
 */
function simulateSettingUpdate(settingId, value) {
  // Show a toast notification
  showToast(
    `Updated ${settingId.replace('-', ' ')} setting to ${value ? 'enabled' : 'disabled'}`,
    'success'
  );
}
