const { useState, useEffect } = React;

function KQLQueryManager() {
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
    const [expandedQueries, setExpandedQueries] = useState(() =>
        queries.reduce((acc, query) => {
            acc[query.id] = true; // Default all cards to expanded
            return acc;
        }, {})
    );

    // Save queries to localStorage
    useEffect(() => {
        localStorage.setItem('kql-queries', JSON.stringify(queries));
    }, [queries]);

    // Highlight code when queries or expanded state changes
    useEffect(() => {
        if (typeof Prism !== 'undefined') {
            Prism.highlightAll();
        }
    }, [queries, expandedQueries]);

    // Add a new query
    const addQuery = () => {
        if (!newQuery.name.trim()) {
            alert('Query name is required.');
            return;
        }
    
        try {
            const sanitizedCode = newQuery.code
                ? newQuery.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')
                : ''; 
    
            const timestamp = new Date().toISOString();
            setQueries([
                ...queries,
                {
                    id: Date.now(),
                    ...newQuery,
                    code: sanitizedCode,
                    version: '1.0',
                    timestamp,
                    history: [
                        {
                            version: '1.0',
                            code: sanitizedCode,
                            documentation: newQuery.documentation,
                            timestamp,
                        },
                    ],
                },
            ]);
            setNewQuery({ name: '', code: '', documentation: '', tags: [] });
            setShowAddForm(false);
        } catch (error) {
            console.error('Failed to add query:', error);
            alert('An error occurred while adding the query. Please try again.');
        }
    };

    // Update an existing query
    const updateQuery = (id) => {
        const timestamp = new Date().toISOString();
        const currentQuery = queries.find((q) => q.id === id);
        const duplicateName = queries.some(
            (query) => query.name === editingQuery.name && query.id !== id
        );
        const newVersion = duplicateName
            ? (parseFloat(currentQuery.version) + 0.1).toFixed(1)
            : currentQuery.version;

        setQueries(
            queries.map((query) => {
                if (query.id === id) {
                    return {
                        ...query,
                        ...editingQuery,
                        version: newVersion,
                        timestamp,
                        history: [
                            ...query.history,
                            {
                                version: newVersion,
                                code: editingQuery.code,
                                documentation: editingQuery.documentation,
                                timestamp,
                            },
                        ],
                    };
                }
                return query;
            })
        );
        setEditingQuery(null);
    };

    // Delete a query
    const deleteQuery = (id) => {
        if (window.confirm('Are you sure you want to delete this query?')) {
            setQueries(queries.filter(query => query.id !== id));
        }
    };

    // Toggle expand/collapse of query cards
    const toggleExpand = (id) => {
        setExpandedQueries(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    // Set query for editing with expanded state
    const setEditingQueryWithExpand = (query) => {
        setEditingQuery(query);
        if (query) {
            setExpandedQueries((prev) => ({
                ...prev,
                [query.id]: true, // Ensure the card is expanded when editing
            }));
        }
    };

    // Copy query code to clipboard
    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Code copied to clipboard!');
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    // Export queries
    const exportQueries = () => {
        if (queries.length === 0) return;
        const dataStr = JSON.stringify(queries, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const downloadAnchorNode = document.createElement('a');
        downloadAnchorNode.setAttribute('href', dataUri);
        downloadAnchorNode.setAttribute('download', 'kql-queries.json');
        document.body.appendChild(downloadAnchorNode);
        downloadAnchorNode.click();
        downloadAnchorNode.remove();
    };

    // Import queries from file
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

    // Filter queries based on search term
    const filteredQueries = queries.filter(query => 
        query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.documentation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full mx-auto">
            <h1 className="text-3xl font-bold mb-6">LeKQL</h1>
            
            {/* Search Bar */}
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
                    className={`button ${queries.length === 0 ? 'cursor-not-allowed opacity-50' : ''}`}
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

            {/* New Query Form */}
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
                    <textarea
                        placeholder="KQL Code"
                        value={newQuery.code}
                        onChange={(e) => setNewQuery({...newQuery, code: e.target.value})}
                        className="w-full p-2 mb-4 border rounded font-mono"
                        rows={5}
                    />
                    <textarea
                        placeholder="Documentation"
                        value={newQuery.documentation}
                        onChange={(e) => setNewQuery({...newQuery, documentation: e.target.value})}
                        className="w-full p-2 mb-4 border rounded"
                        rows={3}
                    />
                    <input
                        type="text"
                        placeholder="Tags (comma-separated)"
                        value={newQuery.tags}
                        onChange={(e) => setNewQuery({...newQuery, tags: e.target.value.split(',')})}
                        className="w-full p-2 mb-4 border rounded"
                    />
                    <button className="button" onClick={addQuery}>Add Query</button>
                    <button className="button button-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
                </div>
            )}

            {/* Query List */}
            {filteredQueries.length === 0 ? (
                <p>No queries found</p>
            ) : (
                filteredQueries.map((query) => (
                    <div key={query.id} className="card mb-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-xl font-bold">{query.name}</h2>
                            <div>
                                <button
                                    className="button button-outline mr-2"
                                    onClick={() => setEditingQueryWithExpand(query)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="button button-outline"
                                    onClick={() => deleteQuery(query.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>

                        {/* Query Code */}
                        {expandedQueries[query.id] && (
                            <div className="mt-4">
                                <pre className="code-block">{query.code}</pre>
                                <button
                                    className="button button-outline"
                                    onClick={() => copyToClipboard(query.code)}
                                >
                                    Copy Code
                                </button>
                            </div>
                        )}

                    </div>
                ))
            )}
        </div>
    );
}

ReactDOM.render(<KQLQueryManager />, document.getElementById('root'));
