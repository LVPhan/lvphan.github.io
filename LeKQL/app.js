const { useState, useEffect } = React;

function LeKQL() {
    const [queries, setQueries] = useState(() => {
        const saved = localStorage.getItem('kql-queries');
        return saved ? JSON.parse(saved) : [];
    });
    
    const [newQuery, setNewQuery] = useState({
        name: '',
        code: '',
        documentation: '',
        tags: []
    });
    
    const [editingQuery, setEditingQuery] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVersions, setSelectedVersions] = useState({});
    
    const [expandedQueries, setExpandedQueries] = useState(() => {
        const saved = localStorage.getItem('kql-queries');
        const savedQueries = saved ? JSON.parse(saved) : [];
        return savedQueries.reduce((acc, query) => ({
            ...acc,
            [query.id]: true
        }), {});
    });

    const [isDarkMode, setIsDarkMode] = useState(() => {
        const savedMode = localStorage.getItem('darkMode');
        return savedMode ? JSON.parse(savedMode) : false;
    });

    // Effect hooks
    useEffect(() => {
        localStorage.setItem('kql-queries', JSON.stringify(queries));
    }, [queries]);
 
    useEffect(() => {
        const versions = {};
        queries.forEach(query => {
            if (!selectedVersions[query.id]) {
                versions[query.id] = query.history.length - 1;
            }
        });
        setSelectedVersions(prev => ({ ...prev, ...versions }));
    }, [queries]);
 
    // Updated syntax highlighting effect
    useEffect(() => {
        const highlightCode = () => {
            if (typeof Prism !== 'undefined') {
                document.querySelectorAll('code').forEach(block => {
                    block.className = block.className.replace(/\s*\bprism-highlighted\b/, '');
                });
                Prism.highlightAll();
            }
        };

        const timeoutId = setTimeout(highlightCode, 100);
        return () => clearTimeout(timeoutId);
    }, [queries, expandedQueries, searchTerm, editingQuery, selectedVersions]);
 
    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(isDarkMode));
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDarkMode]);
 
    useEffect(() => {
        setExpandedQueries(prev => {
            const newExpanded = { ...prev };
            queries.forEach(query => {
                if (!(query.id in newExpanded)) {
                    newExpanded[query.id] = true;
                }
            });
            return newExpanded;
        });
    }, [queries.length]);

    // Helper functions
    const getCurrentVersion = (query) => {
        const versionIndex = selectedVersions[query.id] ?? (query.history.length - 1);
        const version = query.history[versionIndex];
        return {
            ...version,
            id: query.id
        };
    };
    const renderVersionSelector = (query) => {
        return (
            <select 
                value={selectedVersions[query.id] ?? (query.history.length - 1)}
                onChange={(e) => {
                    const newIndex = parseInt(e.target.value);
                    setSelectedVersions(prev => ({
                        ...prev,
                        [query.id]: newIndex
                    }));
                }}
                className={`p-1 border rounded ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
            >
                {query.history.map((version, index) => (
                    <option 
                        key={index} 
                        value={index}
                        className={isDarkMode ? 'bg-gray-800' : 'bg-white'}
                    >
                        v{version.version} ({new Date(version.timestamp).toLocaleDateString()})
                    </option>
                ))}
            </select>
        );
    };
 
    const addQuery = () => {
        if (newQuery.name && newQuery.code) {
            const timestamp = new Date().toISOString();
            const newId = Date.now();
            
            // Clean up tags
            const cleanedTags = Array.isArray(newQuery.tags) 
                ? newQuery.tags.filter(tag => tag.trim() !== '')
                : [];
    
            const firstVersion = {
                version: '1.0',
                name: newQuery.name,
                code: newQuery.code,
                documentation: newQuery.documentation || '',
                tags: cleanedTags,
                timestamp
            };
            
            // Create new query with history
            const newQueryObject = {
                id: newId,
                name: newQuery.name,    // Add this line
                version: '1.0',
                timestamp,
                history: [firstVersion],
                tags: cleanedTags       // Add this line
            };
    
            // Update states in sequence
            setQueries(prevQueries => [newQueryObject, ...prevQueries]);
            setExpandedQueries(prev => ({
                ...prev,
                [newId]: true
            }));
            setSelectedVersions(prev => ({
                ...prev,
                [newId]: 0
            }));
            
            // Reset form last
            setNewQuery({
                name: '',
                code: '',
                documentation: '',
                tags: []
            });
            setShowAddForm(false);
        }
    };
 
    const updateQuery = (id) => {
        const timestamp = new Date().toISOString();
        const currentQuery = queries.find(q => q.id === id);
        const newVersion = (parseFloat(currentQuery.version) + 0.1).toFixed(1);
        
        // Clean up tags - remove empty strings and trim whitespace
        const cleanedTags = editingQuery.tags
            .filter(tag => tag.trim() !== '')
            .map(tag => tag.trim());
        
        const historyEntry = {
            version: newVersion,
            name: editingQuery.name || 'Untitled Query',
            code: editingQuery.code,
            documentation: editingQuery.documentation,
            tags: cleanedTags,
            timestamp
        };
    
        setQueries(prevQueries => {
            const updatedQueries = prevQueries.map(query => {
                if (query.id === id) {
                    const updatedQuery = {
                        ...query,
                        version: newVersion,
                        timestamp,
                        history: [...query.history, historyEntry]
                    };
                    setSelectedVersions(prev => ({
                        ...prev,
                        [id]: updatedQuery.history.length - 1
                    }));
                    return updatedQuery;
                }
                return query;
            });
            return updatedQueries;
        });
        setEditingQuery(null);
    };
 
    const setEditingQueryAndExpand = (query) => {
        const currentVersion = getCurrentVersion(query);
        if (editingQuery && editingQuery.id === query.id) {
            setEditingQuery(null);
        } else {
            setEditingQuery({
                id: query.id,
                name: currentVersion.name,
                code: currentVersion.code,
                documentation: currentVersion.documentation,
                tags: currentVersion.tags || [] // Ensure tags is always an array
            });
            setExpandedQueries(prev => ({
                ...prev,
                [query.id]: true
            }));
        }
    };
 
    const deleteQuery = (id) => {
        if (window.confirm('Are you sure you want to delete this query?')) {
            setQueries(prevQueries => prevQueries.filter(query => query.id !== id));
        }
    };
 
    const toggleExpand = (id) => {
        setExpandedQueries(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };
 
    const copyToClipboard = async (text, button) => {
        try {
            await navigator.clipboard.writeText(text);
            const originalText = button.innerHTML;
            button.innerHTML = 'Copied!';
            setTimeout(() => {
                button.innerHTML = originalText;
            }, 550);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };
 
    const exportQueries = () => {
        const dataStr = JSON.stringify(queries, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataUri);
        downloadAnchorNode.setAttribute('download', 'kql-queries.json');
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };
 
    const importQueries = (event) => {
        const file = event.target.files[0];
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const importedQueries = JSON.parse(e.target.result);
                setQueries([...queries, ...importedQueries]);
            } catch (err) {
                console.error('Error importing queries:', err);
                alert('Error importing file');
            }
        };
        
        reader.readAsText(file);
    };
 
    const filteredQueries = queries.filter(query => {
        const searchLower = searchTerm.toLowerCase().trim();
        if (!searchLower) return true;  // Return all queries if no search term
    
        const currentVersion = getCurrentVersion(query);
        
        try {
            return (
                // Search in current version's content
                (currentVersion.name && currentVersion.name.toLowerCase().includes(searchLower)) ||
                (currentVersion.code && currentVersion.code.toLowerCase().includes(searchLower)) ||
                (currentVersion.documentation && currentVersion.documentation.toLowerCase().includes(searchLower)) ||
                // Search in tags
                (Array.isArray(currentVersion.tags) && currentVersion.tags.some(tag => 
                    tag.toLowerCase().includes(searchLower)
                ))
            );
        } catch (error) {
            console.error('Error filtering query:', error);
            return false;  // Exclude any queries that cause errors
        }
    });

    //Return and Render Section
    return (
        <div className={`max-w-4xl mx-auto transition-colors duration-200 ${isDarkMode ? 'dark' : ''}`}>
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">LeKQL</h1>
                <button
                    className="button button-outline inline-flex items-center"
                    onClick={() => setIsDarkMode(!isDarkMode)}
                >
                    {isDarkMode ? (
                        <>
                            Light Mode
                            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </>
                    ) : (
                        <>
                            Dark Mode
                            <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                            </svg>
                        </>
                    )}
                </button>
            </div>
            
            <div className="mb-6 flex gap-4">   
                <input
                    type="text"
                    placeholder="Search queries..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="p-2 border rounded"
                />
                <button 
                    className="button"
                    onClick={() => setShowAddForm(true)}
                >
                    Add New Query
                </button>
                <button 
                    className={`button button-outline ${queries.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={exportQueries}
                    disabled={queries.length === 0}
                >
                    Export
                </button>
                <input
                    type="file"
                    accept=".json"
                    onChange={importQueries}
                    style={{ display: 'none' }}
                    id="import-file"
                />
                <button
                    className="button button-outline"
                    onClick={() => document.getElementById('import-file').click()}
                >
                    Import
                </button>
            </div>
 
            {showAddForm && (
                <div className="card mb-6">
                    <h2 className="text-xl font-bold mb-4">Add New Query</h2>
                    <input
                        type="text"
                        placeholder="Query Name"
                        value={newQuery.name}
                        onChange={(e) => setNewQuery({...newQuery, name: e.target.value})}
                        className="w-full p-2 mb-4 border rounded"
                    />
                    <div className="mb-4">
                        <label className="block font-bold mb-2">Query Code</label>
                        <textarea
                            placeholder="Enter your KQL code here"
                            value={newQuery.code}
                            onChange={(e) => setNewQuery({...newQuery, code: e.target.value})}
                            className="w-full p-2 border rounded font-mono"
                            rows={5}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-bold mb-2">Documentation</label>
                        <textarea
                            placeholder="Add documentation about your query"
                            value={newQuery.documentation}
                            onChange={(e) => setNewQuery({...newQuery, documentation: e.target.value})}
                            className="w-full p-2 border rounded"
                            rows={3}
                        />
                    </div>
                    <div className="mb-4">
                        <label className="block font-bold mb-2">Tags</label>
                        <input
                            type="text"
                            placeholder="Tags (comma-separated)"
                            value={Array.isArray(newQuery.tags) ? newQuery.tags.join(', ') : ''}
                            onChange={(e) => {
                                const tagsArray = e.target.value
                                    .split(',')
                                    .map(tag => tag.trim())
                                    .filter(tag => tag !== '');
                                setNewQuery({...newQuery, tags: tagsArray});
                            }}
                            className="w-full p-2 border rounded"
                        />
                    </div>
                    <div className="flex gap-2">
                        <button className="button" onClick={addQuery}>Save Query</button>
                        <button 
                            className="button button-outline" 
                            onClick={() => {
                                setNewQuery({name: '', code: '', documentation: '', tags: []});
                                setShowAddForm(false);
                            }}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            <div>
                {filteredQueries.map(query => {
                    const currentVersion = getCurrentVersion(query);
                    return (
                        <div key={query.id} className="card">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1 min-w-0 mr-4"> {/* Add these classes */}
                                    {editingQuery && editingQuery.id === query.id ? (
                                        <input
                                            type="text"
                                            value={editingQuery.name || ''}
                                            onChange={(e) => setEditingQuery({...editingQuery, name: e.target.value})}
                                            className="text-xl font-bold p-2 border rounded w-full"
                                        />
                                    ) : (
                                        <h3 className="text-xl font-bold truncate"> {/* Add truncate */}
                                            {currentVersion.name || 'Untitled Query'}
                                        </h3>
                                    )}
                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                        {renderVersionSelector(query)}
                                    </div>
                                    <div className="mt-2">
                                        {currentVersion.tags && currentVersion.tags.map(tag => (
                                            <span key={tag} className="tag">
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                               </div>
                               <div className="flex gap-2 flex-shrink-0">
                                   <button 
                                       className="button button-outline inline-flex items-center"
                                       onClick={(e) => copyToClipboard(currentVersion.code, e.target)}
                                   >
                                       Copy Code
                                       <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                           <path d="M8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1M8 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M8 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m0 0h2a2 2 0 0 1 2 2v3m2 4H10m0 0 3-3m-3 3 3 3"></path>
                                       </svg>
                                   </button>
                                   <button 
                                       className={`button button-outline inline-flex items-center ${editingQuery && editingQuery.id === query.id ? 'bg-gray-200' : ''}`}
                                       onClick={() => setEditingQueryAndExpand(query)}
                                   >
                                       {editingQuery && editingQuery.id === query.id ? 'Cancel' : 'Edit'}
                                       <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                           <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                       </svg>
                                   </button>
                                   <button 
                                       className="button button-outline inline-flex items-center"
                                       onClick={() => deleteQuery(query.id)}
                                   >
                                       Delete
                                       <svg className="w-4 h-4 ml-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                           <path d="M19 7l-.867 12.142A2 2 0 016.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                       </svg>
                                   </button>
                                   <button
                                       className="button button-outline inline-flex items-center"
                                       onClick={() => toggleExpand(query.id)}
                                   >
                                       {expandedQueries[query.id] ? '▲' : '▼'}
                                   </button>
                               </div>
                           </div>
                           
                           {expandedQueries[query.id] && (
                               <>
                                   {editingQuery && editingQuery.id === query.id ? (
                                       <div className="mb-4">
                                           <div className="mb-4">
                                               <label className="block font-bold mb-2">Query Code</label>
                                               <textarea
                                                   value={editingQuery.code}
                                                   onChange={(e) => setEditingQuery({...editingQuery, code: e.target.value})}
                                                   className="w-full p-2 border rounded font-mono"
                                                   rows={5}
                                               />
                                           </div>
                                           <div className="mb-4">
                                               <label className="block font-bold mb-2">Documentation</label>
                                               <textarea
                                                   value={editingQuery.documentation}
                                                   onChange={(e) => setEditingQuery({...editingQuery, documentation: e.target.value})}
                                                   className="w-full p-2 border rounded"
                                                   rows={3}
                                               />
                                           </div>
                                           <div className="mb-4">
                                               <label className="block font-bold mb-2">Tags</label>
                                               <input
                                                   type="text"
                                                   value={Array.isArray(editingQuery.tags) ? editingQuery.tags.join(',') : ''}
                                                   onChange={(e) => setEditingQuery({...editingQuery, tags: e.target.value.split(',')})}
                                                   className="w-full p-2 border rounded"
                                               />
                                           </div>
                                           <div className="flex gap-2">
                                               <button className="button" onClick={() => updateQuery(query.id)}>Save Changes</button>
                                           </div>
                                       </div>
                                   ) : (
                                       <>
                                           <div className="mb-4">
                                               <h4 className="font-bold mb-2">Documentation</h4>
                                               <div className="bg-gray-50 p-3 rounded">
                                                   {currentVersion.documentation}
                                               </div>
                                           </div>
                                           
                                           <div>
                                               <h4 className="font-bold mb-2">Query Code</h4>
                                               <pre className="code-block line-numbers">
                                                    <code 
                                                        className="language-sql"
                                                        key={`${query.id}-${selectedVersions[query.id]}`}
                                                    >
                                                        {currentVersion.code}
                                                    </code>
                                                </pre>
                                           </div>
                                       </>
                                   )}
                               </>
                           )}
                       </div>
                   );
               })}
           </div>
       </div>
   );
}
 
 ReactDOM.render(<LeKQL />, document.getElementById('root'));
