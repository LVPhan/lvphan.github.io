// Define custom KQL mode for CodeMirror
CodeMirror.defineMode('kql', function () {
    return {
        token: function (stream, state) {
            // KQL Tabular operators and keywords
            const keywords = /\b(as|between|consume|count|datatable|distinct|evaluate|extend|facet|find|fork|getmschema|invoke|join|limit|lookup|make-series|mv-apply|mv-expand|order|parse|parse-where|partition|print|project|project-away|project-keep|project-rename|project-reorder|range|reduce|render|sample|sample-distinct|search|serialize|sort|summarize|take|top|top-hitters|top-nested|union|where|externaldata|let|materialize|set|cache|database|cluster|external_table)\b/i;

            // KQL operators and comparison operators
            const operators = /(\||=~|!~|==|!=|<>|<=|>=|<|>|\+|\-|\*|\/|%|\^|and|or|not|in|!in|has|!has|has_all|has_any|contains|!contains|contains_cs|!contains_cs|startswith|!startswith|startswith_cs|!startswith_cs|endswith|!endswith|endswith_cs|!endswith_cs|matches|regex|isempty|isnotempty|isnull|isnotnull|iff|case|coalesce|iif)\b/i;

            // KQL scalar functions
            const functions = /\b(abs|acos|ago|array_concat|array_iff|array_index_of|array_length|array_reverse|array_rotate_left|array_rotate_right|array_select_dict|array_shift_left|array_shift_right|array_slice|array_sort_asc|array_sort_desc|array_split|asin|atan|atan2|bag_keys|bag_merge|bag_remove_keys|bag_set_key|base64_encode_tostring|base64_decode_tostring|beta_cdf|beta_inv|beta_pdf|bin|bin_at|ceiling|coalesce|columnifexists|cos|cot|countof|current_cluster_endpoint|current_database|current_principal|current_principal_details|current_principal_is_member_of|datetime_add|datetime_diff|datetime_part|dayofmonth|dayofweek|dayofyear|degrees|dynamic|endofday|endofmonth|endofweek|endofyear|estimate_data_size|exp|exp10|exp2|extract|extract_all|extractjson|floor|format_bytes|format_datetime|format_timespan|gamma|getmonth|getyear|hash|hash_combine|hash_many|hash_md5|hash_sha1|hash_sha256|hourofday|indexof|indexof_regex|isascii|isempty|isfinite|isinf|isnan|isnotempty|isnotnull|isnull|log|log10|log2|loggamma|make_bag|make_bag_if|make_datetime|make_list|make_list_if|make_list_with_nulls|make_set|make_set_if|make_timespan|max_of|min_of|monthofyear|mvexpand|now|pack|pack_all|pack_array|pack_dictionary|parseurl|pow|radians|rand|range|replace|replace_regex|reverse|round|series_add|series_decompose|series_decompose_anomalies|series_decompose_forecast|series_divide|series_equals|series_fft|series_fill_backward|series_fill_const|series_fill_forward|series_fill_linear|series_fir|series_fit_2lines|series_fit_2lines_dynamic|series_fit_line|series_fit_line_dynamic|series_fit_poly|series_greater|series_greater_equals|series_iir|series_less|series_less_equals|series_multiply|series_not_equals|series_outliers|series_periods_detect|series_periods_validate|series_seasonal|series_stats|series_stats_dynamic|series_subtract|set_difference|set_has_element|set_intersect|set_union|sign|sin|sinh|split|sqrt|startofday|startofmonth|startofweek|startofyear|strcat|strcat_delim|strcmp|string_size|strlen|strncmp|strncmp_cis|strrep|substring|tan|tanh|tobool|todatetime|todouble|toguid|tohex|toint|tolong|toreal|tostring|totimespan|treepath|trim|trim_end|trim_regex|trim_start|typeof|unixtime_microseconds_todatetime|unixtime_milliseconds_todatetime|unixtime_nanoseconds_todatetime|unixtime_seconds_todatetime|url_decode|url_encode|welch_test|zip)\b/i;

            // Aggregation functions
            const aggregates = /\b(any|anyif|arg_max|arg_min|avg|avgif|buildschema|count|countif|dcount|dcountif|make_bag|make_bag_if|make_list|make_list_if|make_list_with_nulls|make_set|make_set_if|max|maxif|min|minif|percentile|percentiles|percentiles_array|stdev|stdevif|stdevp|sum|sumif|take_any|take_anyif|tdigest|tdigest_merge|variance|varianceif|variancep)\b/i;

            // KQL literals and data types
            const literals = /\b(true|false|null|dynamic|bool|boolean|int|long|real|double|string|guid|datetime|timespan|decimal)\b/i;

            // Comments
            const comments = /\/\/.*$|\/\*[\s\S]*?\*\//;

            // Strings 
            const strings = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|@"(?:[^"]|"")*"|@'(?:[^']|'')*'/;

            // Numbers including scientific notation
            const numbers = /\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?[dDfFmM]?\b/;

            // Time literals
            const timeLiterals = /\b\d+(?:\.\d+)?(?:d|h|m|s|ms|microsecond|tick)\b/i;

            // Field names and identifiers
            const fields = /\b[a-zA-Z_][a-zA-Z0-9_]*\b/;

            if (stream.match(comments)) return 'comment';
            if (stream.match(strings)) return 'kql-string';
            if (stream.match(timeLiterals)) return 'kql-timespan';
            if (stream.match(numbers)) return 'kql-number';
            if (stream.match(keywords)) return 'kql-keyword';
            if (stream.match(aggregates)) return 'kql-aggregate';
            if (stream.match(functions)) return 'kql-function';
            if (stream.match(operators)) return 'kql-operator';
            if (stream.match(literals)) return 'kql-literal';
            if (stream.match(fields)) return 'kql-field';

            stream.next();
            return null;
        }
    };
});

// Application State
let queries = [];
let selectedQueryId = null;
let queryEditor = null;
let activeTab = 'queries';
let currentVersionIndex = null;

// Tag color classes
const tagColors = ['tag-blue', 'tag-green', 'tag-purple', 'tag-orange', 'tag-pink'];

// Utility Functions
const getTagColor = (tag) => {
    try {
        let hash = 0;
        for (let i = 0; i < tag.length; i++) {
            hash = (hash * 31 + tag.charCodeAt(i)) | 0;
        }
        return tagColors[Math.abs(hash) % tagColors.length];
    } catch (error) {
        console.error('Error in getTagColor:', error);
        return 'tag-blue';
    }
};

const showToast = (toastId, message, duration = 2000) => {
    try {
        const toast = document.getElementById(toastId);
        if (!toast) throw new Error(`Toast element ${toastId} not found`);
        if (message) {
            const messageElement = toast.querySelector('span');
            if (messageElement) messageElement.textContent = message;
        }
        toast.style.display = 'block';
        toast.offsetHeight;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.style.display = 'none';
            }, 300);
        }, duration);
    } catch (error) {
        console.error('Error in showToast:', error);
    }
};

const updateQueryCount = () => {
    try {
        const queryCountElement = document.getElementById('queryCount');
        const favoriteCountElement = document.getElementById('favoriteCount');
        if (!queryCountElement || !favoriteCountElement) {
            console.warn('Counter elements not found');
            return;
        }
        queryCountElement.textContent = queries.length;
        favoriteCountElement.textContent = queries.filter(q => q.isFavorite).length;

        // keep Export button in sync
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.disabled = queries.length === 0;
        }
    } catch (error) {
        console.error('Error in updateQueryCount:', error);
    }
};

// Version Control Functions
const createNewVersion = (query, queryText, name, tags) => {
    const timestamp = Date.now();
    const version = {
        id: timestamp,
        query: queryText,
        name: name,
        tags: [...(tags || [])],
        timestamp: timestamp,
        version: query.versions ? query.versions.length + 1 : 1
    };
    
    if (!query.versions) {
        query.versions = [];
    }
    
    query.versions.push(version);
    query.currentVersion = version.id;
    
    return version;
};

const updateVersionDisplay = () => {
    try {
        const versionBadge = document.getElementById('versionBadge');
        const versionHistoryBtn = document.getElementById('versionHistoryBtn');
        const currentVersionSpan = document.getElementById('currentVersion');
        
        if (!versionBadge || !versionHistoryBtn || !currentVersionSpan) return;
        
        if (selectedQueryId) {
            const query = queries.find(q => q.id === selectedQueryId);
            if (query && query.versions && query.versions.length > 0) {
                const currentVersion = query.versions.find(v => v.id === query.currentVersion) || query.versions[query.versions.length - 1];
                currentVersionSpan.textContent = `v${currentVersion.version}`;
                versionBadge.classList.remove('hidden');
                versionHistoryBtn.classList.remove('hidden');
            } else {
                versionBadge.classList.add('hidden');
                versionHistoryBtn.classList.add('hidden');
            }
        } else {
            versionBadge.classList.add('hidden');
            versionHistoryBtn.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error updating version display:', error);
    }
};

const showVersionHistory = () => {
    try {
        if (!selectedQueryId) return;
        
        const query = queries.find(q => q.id === selectedQueryId);
        if (!query || !query.versions) return;
        
        const modal = document.getElementById('versionModal');
        const versionList = document.getElementById('versionList');
        
        if (!modal || !versionList) return;
        
        // Sort versions by timestamp (newest first)
        const sortedVersions = [...query.versions].sort((a, b) => b.timestamp - a.timestamp);
        
        versionList.innerHTML = sortedVersions.map((version, index) => {
            const isCurrentVersion = version.id === query.currentVersion;
            const date = new Date(version.timestamp).toLocaleString();
            
            return `
                <div class="version-item p-4 bg-gray-50 dark:bg-gray-700 rounded-lg ${isCurrentVersion ? 'current' : ''}" data-version-id="${version.id}">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-3">
                            <span class="version-badge">
                                v${version.version}
                            </span>
                            ${isCurrentVersion ? '<span class="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full font-medium">Current</span>' : ''}
                        </div>
                        <div class="flex items-center space-x-2">
                            ${!isCurrentVersion ? `<button onclick="revertToVersion('${version.id}')" class="btn-secondary btn-xs flex inline-center">
                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                </svg>
                                Revert
                            </button>` : ''}
                            <button onclick="viewVersion('${version.id}')" class="btn-secondary btn-xs flex inline-center">
                                <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                View
                            </button>
                        </div>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <div class="flex items-center space-x-4">
                            <span>📅 ${date}</span>
                            <span>📝 ${version.name}</span>
                        </div>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 bg-gray-100 dark:bg-gray-600 p-2 rounded font-mono">
                        ${version.query.substring(0, 100)}${version.query.length > 100 ? '...' : ''}
                    </div>
                    ${version.tags && version.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-2">
                            ${version.tags.map(tag => `<span class="modern-tag ${getTagColor(tag)} text-xs">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        }).join('');
        
        modal.style.display = 'block';
        setTimeout(() => {
            modal.classList.add('show');
            modal.querySelector('.modal').classList.add('show');
        }, 10);
        
    } catch (error) {
        console.error('Error showing version history:', error);
        showToast('toast-error', 'Failed to show version history');
    }
};

const revertToVersion = (versionId) => {
    try {
        if (!selectedQueryId) return;
        
        const query = queries.find(q => q.id === selectedQueryId);
        if (!query || !query.versions) return;
        
        const version = query.versions.find(v => v.id.toString() === versionId.toString());
        if (!version) return;
        
        if (confirm(`Are you sure you want to revert to version ${version.version}? This will create a new version with the old content.`)) {
            // Create a new version with the reverted content
            createNewVersion(query, version.query, version.name, version.tags);
            
            // Update the current query data
            query.name = version.name;
            query.query = version.query;
            query.tags = [...(version.tags || [])];
            
            // Save to localStorage
            localStorage.setItem('kqlQueries', JSON.stringify(queries));
            
            // Update the UI
            loadQuery(selectedQueryId);
            loadQueries(document.getElementById('searchInput')?.value || '');
            
            // Close modal
            closeVersionModal();
            
            showToast('toast-version', `Reverted to version ${version.version}!`);
        }
        
    } catch (error) {
        console.error('Error reverting to version:', error);
        showToast('toast-error', 'Failed to revert to version');
    }
};

const viewVersion = (versionId) => {
    try {
        if (!selectedQueryId) return;
        
        const query = queries.find(q => q.id === selectedQueryId);
        if (!query || !query.versions) return;
        
        const version = query.versions.find(v => v.id.toString() === versionId.toString());
        if (!version) return;
        
        // Temporarily load this version for viewing
        const queryNameInput = document.getElementById('queryName');
        if (queryNameInput) queryNameInput.value = version.name || '';
        if (queryEditor) queryEditor.setValue(version.query || '');
        renderTags(version.tags || []);
        
        // Update version display to show we're viewing an old version
        const currentVersionSpan = document.getElementById('currentVersion');
        if (currentVersionSpan) {
            currentVersionSpan.textContent = `v${version.version} (Viewing)`;
            currentVersionSpan.parentElement.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        }
        
        // Store current version index for reference
        currentVersionIndex = query.versions.findIndex(v => v.id.toString() === versionId.toString());
        
        closeVersionModal();
        
        setTimeout(() => {
            queryEditor.refresh();
        }, 100);
        
    } catch (error) {
        console.error('Error viewing version:', error);
        showToast('toast-error', 'Failed to view version');
    }
};

const closeVersionModal = () => {
    try {
        const modal = document.getElementById('versionModal');
        if (modal) {
            modal.classList.remove('show');
            modal.querySelector('.modal').classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    } catch (error) {
        console.error('Error closing version modal:', error);
    }
};

// Initialize CodeMirror
const initCodeMirror = () => {
    try {
        console.log('Initializing CodeMirror');
        const queryInput = document.getElementById('queryInput');
        if (!queryInput) throw new Error('queryInput element not found');
        const currentTheme = localStorage.getItem('theme') === 'dark' ? 'material-darker' : 'material';
        queryEditor = CodeMirror(queryInput, {
            value: '',
            lineNumbers: true,
            mode: 'kql',
            theme: currentTheme,
            placeholder: 'Enter your KQL query here...\n\n// Example:\nSecurityEvent\n| where EventID == 4625\n| summarize FailedAttempts = count() by Account\n| sort by FailedAttempts desc',
            viewportMargin: Infinity,
            lineWrapping: true,
            autoCloseBrackets: true,
            matchBrackets: true,
            indentUnit: 2,
            tabSize: 2
        });

        queryEditor.setSize('100%', '18rem');
        setTimeout(() => {
            queryEditor.refresh();
            console.log('CodeMirror refreshed');
        }, 100);
    } catch (error) {
        console.error('CodeMirror initialization failed:', error);
        showToast('toast-error', 'Failed to initialize editor');
    }
};

// Theme Management
const setTheme = (theme) => {
    try {
        console.log(`Setting theme to: ${theme}`);
        const html = document.documentElement;
        const lightIcon = document.querySelector('.light-icon');
        const darkIcon = document.querySelector('.dark-icon');
        if (!lightIcon || !darkIcon) throw new Error('Theme icons not found');

        if (theme === 'dark') {
            html.classList.add('dark');
            lightIcon.classList.add('hidden');
            darkIcon.classList.remove('hidden');
        } else {
            html.classList.remove('dark');
            lightIcon.classList.remove('hidden');
            darkIcon.classList.add('hidden');
        }

        localStorage.setItem('theme', theme);
        if (queryEditor) {
            setTimeout(() => {
                queryEditor.setOption('theme', theme === 'dark' ? 'material-darker' : 'default');
                queryEditor.refresh();
                console.log('CodeMirror theme updated');
            }, 100);
        }
    } catch (error) {
        console.error('Error in setTheme:', error);
        showToast('toast-error', 'Failed to switch theme');
    }
};

// Query Management
const loadQueries = (searchTerm = '') => {
    try {
        console.log(`loadQueries called with activeTab: ${activeTab}, searchTerm: ${searchTerm}`);
        const queryList = document.getElementById('queryList');
        const favoriteList = document.getElementById('favoriteList');
        if (!queryList || !favoriteList) throw new Error('List elements not found');

        const filteredQueries = queries.filter(q => {
            const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (q.tags && q.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase())));
            return matchesSearch;
        });

        const favoriteQueries = filteredQueries.filter(q => q.isFavorite);
        console.log(`Filtered queries count: ${filteredQueries.length}, Favorite queries count: ${favoriteQueries.length}`);

        // Populate queryList
        if (filteredQueries.length === 0 && activeTab === 'queries') {
            queryList.innerHTML = `
            <li class="text-center py-12">
              <div class="empty-state text-4xl mb-4">${searchTerm ? '🔍' : '📝'}</div>
              <p class="text-gray-500 dark:text-gray-400 font-medium">
                ${searchTerm ? 'No matching queries' : 'No queries yet'}
              </p>
              <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
                ${searchTerm ? 'Try a different search term' : 'Create your first KQL query!'}
              </p>
            </li>
          `;
        } else if (activeTab === 'queries') {
            queryList.innerHTML = filteredQueries.map(query => {
                const versionInfo = query.versions && query.versions.length > 0 ? 
                    `<span class="text-xs text-purple-500 dark:text-purple-400 ml-2">v${query.versions[query.versions.length - 1].version}</span>` : 
                    '<span class="text-xs text-gray-400 ml-2">v1.0</span>';
                
                return `
                <li class="query-item p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 animate-fade-in" onclick="loadQuery(${query.id})">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center">
                      <h3 class="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">${query.name}</h3>
                      ${versionInfo}
                    </div>
                    <div class="flex items-center space-x-2">
                      <button class="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                              onclick="toggleFavorite(${query.id}); event.stopPropagation();"
                              aria-label="${query.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <svg class="w-4 h-4" fill="${query.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                      </button>
                      <div class="flex items-center text-xs text-gray-500">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        ${new Date(query.id).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-1 mb-2">
                    ${query.tags && query.tags.length > 0 ? query.tags.map(tag => `
                      <span class="modern-tag ${getTagColor(tag)}">
                        ${tag}
                      </span>
                    `).join('') : '<span class="text-xs text-gray-400 dark:text-gray-500">No tags</span>'}
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    ${query.query ? query.query.substring(0, 100) + (query.query.length > 100 ? '...' : '') : 'No query content'}
                  </p>
                </li>
              `;
            }).join('');
        }

        // Populate favoriteList
        if (favoriteQueries.length === 0 && activeTab === 'favorites') {
            favoriteList.innerHTML = `
            <li class="text-center py-12">
              <div class="empty-state text-4xl mb-4">${searchTerm ? '🔍' : '⭐'}</div>
              <p class="text-gray-500 dark:text-gray-400 font-medium">
                ${searchTerm ? 'No matching favorites' : 'No favorite queries yet'}
              </p>
              <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
                ${searchTerm ? 'Try a different search term' : 'Mark some queries as favorites!'}
              </p>
            </li>
          `;
        } else if (activeTab === 'favorites') {
            favoriteList.innerHTML = favoriteQueries.map(query => {
                const versionInfo = query.versions && query.versions.length > 0 ? 
                    `<span class="text-xs text-purple-500 dark:text-purple-400 ml-2">v${query.versions[query.versions.length - 1].version}</span>` : 
                    '<span class="text-xs text-gray-400 ml-2">v1.0</span>';
                
                return `
                <li class="query-item p-4 bg-gray-50 dark:bg-gray-700 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 animate-fade-in" onclick="loadQuery(${query.id})">
                  <div class="flex justify-between items-start mb-2">
                    <div class="flex items-center">
                      <h3 class="font-semibold text-gray-900 dark:text-white text-sm line-clamp-1">${query.name}</h3>
                      ${versionInfo}
                    </div>
                    <div class="flex items-center space-x-2">
                      <button class="text-yellow-500 hover:text-yellow-600 dark:text-yellow-400 dark:hover:text-yellow-300"
                              onclick="toggleFavorite(${query.id}); event.stopPropagation();"
                              aria-label="${query.isFavorite ? 'Remove from favorites' : 'Add to favorites'}">
                        <svg class="w-4 h-4" fill="${query.isFavorite ? 'currentColor' : 'none'}" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
                        </svg>
                      </button>
                      <div class="flex items-center text-xs text-gray-500">
                        <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        ${new Date(query.id).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div class="flex flex-wrap gap-1 mb-2">
                    ${query.tags && query.tags.length > 0 ? query.tags.map(tag => `
                      <span class="modern-tag ${getTagColor(tag)}">
                        ${tag}
                      </span>
                    `).join('') : '<span class="text-xs text-gray-400 dark:text-gray-500">No tags</span>'}
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    ${query.query ? query.query.substring(0, 100) + (query.query.length > 100 ? '...' : '') : 'No query content'}
                  </p>
                </li>
              `;
            }).join('');
        }

        // Toggle visibility
        queryList.classList.toggle('hidden', activeTab !== 'queries');
        favoriteList.classList.toggle('hidden', activeTab !== 'favorites');

        updateQueryCount();
    } catch (error) {
        console.error('Loading queries failed:', error);
        const queryList = document.getElementById('queryList');
        const favoriteList = document.getElementById('favoriteList');
        const errorHtml = `
          <li class="text-center py-12">
            <div class="empty-state text-6xl mb-4">⚠️</div>
            <p class="text-gray-500 dark:text-gray-400 font-medium">Error loading queries</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Please try refreshing the page</p>
          </li>
        `;
        if (queryList) queryList.innerHTML = errorHtml;
        if (favoriteList) favoriteList.innerHTML = errorHtml;
        showToast('toast-error', 'Failed to load queries');
    }
};

const loadQuery = (id) => {
    try {
        console.log(`loadQuery called with id: ${id}`);
        const query = queries.find(q => q.id === id);
        if (!query) {
            console.error(`Query with id ${id} not found`);
            throw new Error('Query not found');
        }
        console.log(`Loading query: ${JSON.stringify(query)}`);
        selectedQueryId = id;
        currentVersionIndex = null; // Reset version index

        const queryNameInput = document.getElementById('queryName');
        const tagInput = document.getElementById('tagInput');
        const deleteBtn = document.getElementById('deleteBtn');
        if (!queryNameInput || !tagInput || !queryEditor || !deleteBtn) {
            throw new Error('Required DOM elements or queryEditor not found');
        }

        queryNameInput.value = query.name || '';
        queryEditor.setValue(query.query || '');
        tagInput.value = '';
        renderTags(query.tags || []);
        deleteBtn.disabled = false;
        copyBtn.disabled = false;

        // Reset version display styling
        const currentVersionSpan = document.getElementById('currentVersion');
        if (currentVersionSpan && currentVersionSpan.parentElement) {
            currentVersionSpan.parentElement.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
        }

        updateVersionDisplay();

        setTimeout(() => {
            queryEditor.refresh();
            console.log('CodeMirror refreshed after loading query');
        }, 100);
    } catch (error) {
        console.error('Loading query failed:', error);
        showToast('toast-error', `Failed to load query: ${error.message}`);
    }
};

const toggleFavorite = (id) => {
    try {
        console.log(`toggleFavorite called with id: ${id}`);
        const query = queries.find(q => q.id === id);
        if (!query) throw new Error('Query not found');
        query.isFavorite = !query.isFavorite;
        localStorage.setItem('kqlQueries', JSON.stringify(queries));
        loadQueries(document.getElementById('searchInput')?.value || '');
        showToast('toast-favorite', query.isFavorite ? 'Query added to favorites!' : 'Query removed from favorites!');
    } catch (error) {
        console.error('Toggling favorite failed:', error);
        showToast('toast-error', 'Failed to toggle favorite');
    }
};

const renderTags = (tags) => {
    try {
        console.log('Rendering tags:', tags);
        const tagList = document.getElementById('tagList');
        if (!tagList) throw new Error('tagList element not found');

        if (tags && tags.length > 0) {
            tagList.style.display = 'flex'; // Show the div
            tagList.innerHTML = tags.map(tag => 
                `<span class="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getTagColor(tag)}">
                    ${tag.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}
                    <button class="ml-2 opacity-70 hover:opacity-100 transition-opacity" 
                            onclick="removeTag('${tag.replace(/'/g, "\\'").replace(/"/g, '&quot;') }')" 
                            aria-label="Remove tag">
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </span>`
            ).join('');
        } else {
            tagList.style.display = 'none'; // Hide the div
            tagList.innerHTML = '';
        }

    } catch (error) {
        console.error('Rendering tags failed:', error);
        showToast('toast-error', 'Failed to render tags');
    }
};

const removeTag = (tagToRemove) => {
    try {
        console.log(`Removing tag: ${tagToRemove}`);
        if (!selectedQueryId) throw new Error('No query selected');
        const query = queries.find(q => q.id === selectedQueryId);
        if (!query) throw new Error('Query not found');
        query.tags = query.tags.filter(tag => tag !== tagToRemove);
        localStorage.setItem('kqlQueries', JSON.stringify(queries));
        renderTags(query.tags);
        loadQueries(document.getElementById('searchInput')?.value || '');
    } catch (error) {
        console.error('Removing tag failed:', error);
        showToast('toast-error', 'Failed to remove tag');
    }
};

const addTags = () => {
    try {
        console.log('Adding tags');
        const tagInput = document.getElementById('tagInput');
        if (!tagInput) throw new Error('tagInput element not found');
        const newTags = tagInput.value.split(',')
            .map(t => t.trim())
            .filter(t => t && t.length > 0);

        if (newTags.length === 0) return;

        if (selectedQueryId) {
            const query = queries.find(q => q.id === selectedQueryId);
            if (!query) throw new Error('Query not found');
            const existingTags = query.tags || [];
            const uniqueNewTags = newTags.filter(tag => !existingTags.includes(tag));
            query.tags = [...existingTags, ...uniqueNewTags];
            localStorage.setItem('kqlQueries', JSON.stringify(queries));
            renderTags(query.tags);
            loadQueries(document.getElementById('searchInput')?.value || '');
        }

        tagInput.value = '';
    } catch (error) {
        console.error('Adding tags failed:', error);
        showToast('toast-error', 'Failed to add tags');
    }
};

const clearEditor = () => {
    try {
        console.log('Clearing editor');
        selectedQueryId = null;
        currentVersionIndex = null;
        const queryNameInput = document.getElementById('queryName');
        const tagInput = document.getElementById('tagInput');
        const deleteBtn = document.getElementById('deleteBtn');
        if (!queryNameInput || !tagInput || !queryEditor || !deleteBtn) {
            throw new Error('Required DOM elements or queryEditor not found');
        }
        queryNameInput.value = '';
        queryEditor.setValue('');
        tagInput.value = '';
        renderTags([]);
        deleteBtn.disabled = true;
        copyBtn.disabled = true;
        updateVersionDisplay();
        setTimeout(() => {
            queryEditor.refresh();
            console.log('CodeMirror refreshed after clearing editor');
        }, 100);
    } catch (error) {
        console.error('Clearing editor failed:', error);
        showToast('toast-error', 'Failed to clear editor');
    }
};

// Initialize application
const init = () => {
    try {
        console.log('Initializing application');
        // Initialize queries from localStorage
        try {
            const storedQueries = localStorage.getItem('kqlQueries');
            if (storedQueries) {
                queries = JSON.parse(storedQueries);
                if (!Array.isArray(queries)) {
                    console.warn('Invalid queries in localStorage, resetting to empty array');
                    queries = [];
                    localStorage.setItem('kqlQueries', JSON.stringify(queries));
                }
            }
        } catch (error) {
            console.error('Failed to load queries from localStorage:', error);
            queries = [];
            localStorage.setItem('kqlQueries', JSON.stringify(queries));
            showToast('toast-error', 'Failed to load saved queries, resetting to empty');
        }

        // Initialize theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);

        // Initialize CodeMirror
        initCodeMirror();

        // Load queries
        loadQueries();

        // Setup event listeners
        setupEventListeners();

        console.log('Initialization complete');
    } catch (error) {
        console.error('Initialization failed:', error);
        showToast('toast-error', 'Failed to initialize application: ' + error.message);
    }
};

const setupEventListeners = () => {
    try {
        console.log('Setting up event listeners');

        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                console.log('Theme toggle clicked');
                const newTheme = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
                setTheme(newTheme);
            });
        }

        // New query button
        const newQueryBtn = document.getElementById('newQueryBtn');
        if (newQueryBtn) {
            newQueryBtn.addEventListener('click', () => {
                console.log('New query button clicked');
                clearEditor();
            });
        }

        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                console.log(`Search input changed: ${e.target.value}`);
                loadQueries(e.target.value);
            });
        }

        // Tab switching
        const tabQueries = document.getElementById('tabQueries');
        const tabFavorites = document.getElementById('tabFavorites');
        if (tabQueries && tabFavorites) {
            tabQueries.addEventListener('click', () => {
                console.log('My Queries tab clicked');
                activeTab = 'queries';
                tabQueries.classList.add('active-tab');
                tabFavorites.classList.remove('active-tab');
                loadQueries(document.getElementById('searchInput')?.value || '');
            });

            tabFavorites.addEventListener('click', () => {
                console.log('Favorites tab clicked');
                activeTab = 'favorites';
                tabFavorites.classList.add('active-tab');
                tabQueries.classList.remove('active-tab');
                loadQueries(document.getElementById('searchInput')?.value || '');
            });
        }

        // Version history button
        const versionHistoryBtn = document.getElementById('versionHistoryBtn');
        if (versionHistoryBtn) {
            versionHistoryBtn.addEventListener('click', showVersionHistory);
        }

        // Close version modal
        const closeVersionModalBtn = document.getElementById('closeVersionModal');
        if (closeVersionModalBtn) {
            closeVersionModalBtn.addEventListener('click', () => {
                closeVersionModal();
            });
        }

        // Close modal on backdrop click
        const versionModal = document.getElementById('versionModal');
        if (versionModal) {
            versionModal.addEventListener('click', (e) => {
                if (e.target === versionModal) {
                    closeVersionModal();
                }
            });
        }

        // Tag input - add tags on Enter
        const tagInput = document.getElementById('tagInput');
        if (tagInput) {
            tagInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    console.log('Enter pressed in tag input');
                    e.preventDefault();
                    addTags();
                }
            });
        }

        // Save query button
        const saveQueryBtn = document.getElementById('saveQueryBtn');
        if (saveQueryBtn) {
            saveQueryBtn.addEventListener('click', () => {
                try {
                    console.log('Save query button clicked');
                    const name = document.getElementById('queryName')?.value.trim();
                    const queryText = queryEditor?.getValue().trim();

                    if (!name || !queryText) {
                        showToast('toast-error', 'Please enter both a query name and query content.');
                        return;
                    }

                    const newTags = document.getElementById('tagInput')?.value
                        .split(',')
                        .map(t => t.trim())
                        .filter(t => t);

                    if (selectedQueryId) {
                        // Update existing query
                        const query = queries.find(q => q.id === selectedQueryId);
                        if (!query) throw new Error('Query not found');
                        
                        // Check if content has changed to create a new version
                        const hasChanged = query.name !== name || query.query !== queryText || 
                            JSON.stringify(query.tags || []) !== JSON.stringify([...(query.tags || []), ...newTags.filter(tag => !(query.tags || []).includes(tag))]);
                        
                        if (hasChanged) {
                            // Create new version
                            const existingTags = query.tags || [];
                            const uniqueNewTags = newTags.filter(tag => !existingTags.includes(tag));
                            const allTags = [...existingTags, ...uniqueNewTags];
                            
                            createNewVersion(query, queryText, name, allTags);
                        }
                        
                        query.name = name;
                        query.query = queryText;
                        const existingTags = query.tags || [];
                        const uniqueNewTags = newTags.filter(tag => !existingTags.includes(tag));
                        query.tags = [...existingTags, ...uniqueNewTags];
                    } else {
                        // Create new query
                        const newQuery = {
                            id: Date.now(),
                            name,
                            query: queryText,
                            tags: newTags,
                            isFavorite: false
                        };
                        
                        // Create initial version
                        createNewVersion(newQuery, queryText, name, newTags);
                        
                        queries.push(newQuery);
                        selectedQueryId = newQuery.id;
                        
                    }

                    localStorage.setItem('kqlQueries', JSON.stringify(queries));
                    document.getElementById('tagInput').value = '';
                    loadQueries(document.getElementById('searchInput')?.value || '');
                    updateVersionDisplay();
                    showToast('toast-save');

                    if (selectedQueryId) {
                        const query = queries.find(q => q.id === selectedQueryId);
                        renderTags(query.tags || []);
                        copyBtn.disabled = false;
                        deleteBtn.disabled = false;
                    } else {
                        renderTags([]);
                    }
                } catch (error) {
                    console.error('Saving query failed:', error);
                    showToast('toast-error', 'Failed to save query');
                }
            });
        }

        // Copy button
        const copyBtn = document.getElementById('copyBtn');
        if (copyBtn) {
            copyBtn.addEventListener('click', async () => {
                try {
                    console.log('Copy button clicked');
                    const queryText = queryEditor.getValue();
                    await navigator.clipboard.writeText(queryText);
                    showToast('toast-copy');
                } catch (error) {
                    console.error('Copying to clipboard failed:', error);
                    const textArea = document.createElement('textarea');
                    textArea.value = queryEditor.getValue();
                    document.body.appendChild(textArea);
                    textArea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textArea);
                    showToast('toast-copy');
                }
            });
        }

        // Delete button
        const deleteBtn = document.getElementById('deleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                console.log('Delete button clicked');
                if (selectedQueryId && confirm('Are you sure you want to delete this query?')) {
                    try {
                        queries = queries.filter(q => q.id !== selectedQueryId);
                        localStorage.setItem('kqlQueries', JSON.stringify(queries));
                        clearEditor();
                        loadQueries(document.getElementById('searchInput')?.value || '');
                        showToast('toast-delete');
                    } catch (error) {
                        console.error('Deleting query failed:', error);
                        showToast('toast-error', 'Failed to delete query');
                    }
                }
            });
        }

        // Export button
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                console.log('Export button clicked');
                try {
                    const data = JSON.stringify(queries, null, 2);
                    const blob = new Blob([data], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `kql_queries_${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                } catch (error) {
                    console.error('Exporting queries failed:', error);
                    showToast('toast-error', 'Failed to export queries');
                }
            });
        }

        // Import button
        const importBtn = document.getElementById('importBtn');
        const importInput = document.getElementById('importInput');
        if (importBtn && importInput) {
            importBtn.addEventListener('click', () => {
                console.log('Import button clicked');
                importInput.click();
            });

            importInput.addEventListener('change', (e) => {
                console.log('Import input changed');
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        try {
                            const importedQueries = JSON.parse(event.target.result);
                            if (Array.isArray(importedQueries)) {
                                queries = importedQueries.map(q => ({
                                    ...q,
                                    isFavorite: q.isFavorite || false,
                                    versions: q.versions || [],
                                    currentVersion: q.currentVersion || null
                                }));
                                localStorage.setItem('kqlQueries', JSON.stringify(queries));
                                loadQueries(document.getElementById('searchInput')?.value || '');
                                clearEditor();
                                showToast('toast-save', `Successfully imported ${queries.length} queries!`);
                            } else {
                                showToast('toast-error', 'Invalid file format. Please select a valid JSON file.');
                            }
                        } catch (error) {
                            console.error('Parsing imported file failed:', error);
                            showToast('toast-error', 'Failed to import queries. Please check the file format.');
                        }
                    };
                    reader.readAsText(file);
                }
            });
        }

        console.log('Event listeners setup complete');
    } catch (error) {
        console.error('Setting up event listeners failed:', error);
        showToast('toast-error', 'Failed to initialize event listeners: ' + error.message);
    }
};

// Make functions globally available
window.loadQuery = loadQuery;
window.removeTag = removeTag;
window.toggleFavorite = toggleFavorite;
window.revertToVersion = revertToVersion;
window.viewVersion = viewVersion;
window.closeVersionModal = closeVersionModal;

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        console.log('DOM content loaded, starting init');
        init();
        clearEditor();
    });
} else {
    console.log('DOM already loaded, starting init');
    init();
    clearEditor();
}
