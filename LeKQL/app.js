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
    const [expandedQueries, setExpandedQueries] = useState({});

    useEffect(() => {
    localStorage.setItem('kql-queries', JSON.stringify(queries));
    }, [queries])

    useEffect(() => {
    if (typeof Prism !== 'undefined') {
        Prism.highlightAll();
    }
    }, [queries, expandedQueries]);

    const addQuery = () => {
        if (newQuery.name && newQuery.code) {
            const timestamp = new Date().toISOString();
            setQueries([...queries, {
                id: Date.now(),
                ...newQuery,
                version: '1.0',
                timestamp,
                history: [{
                    version: '1.0',
                    code: newQuery.code,
                    documentation: newQuery.documentation,
                    timestamp
                }]
            }]);
            setNewQuery({ name: '', code: '', documentation: '', tags: '' });
            setShowAddForm(false);
        }
    };

    const updateQuery = (id) => {
        const timestamp = new Date().toISOString();
        const currentQuery = queries.find(q => q.id === id);
        const newVersion = (parseFloat(currentQuery.version) + 0.1).toFixed(1);
        
        setQueries(queries.map(query => {
            if (query.id === id) {
                return {
                    ...query,
                    ...editingQuery,
                    version: newVersion,
                    timestamp,
                    history: [...query.history, {
                        version: newVersion,
                        code: editingQuery.code,
                        documentation: editingQuery.documentation,
                        timestamp
                    }]
                };
            }
            return query;
        }));
        setEditingQuery(null);
    };

    const deleteQuery = (id) => {
        if (window.confirm('Are you sure you want to delete this query?')) {
            setQueries(queries.filter(query => query.id !== id));
        }
    };

    const toggleExpand = (id) => {
        setExpandedQueries(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const copyToClipboard = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('Code copied to clipboard!');
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

    const filteredQueries = queries.filter(query => 
        query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.documentation.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full mx-auto">
            <h1 className="text-3xl font-bold mb-6">KQL Query Manager</h1>
            
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
                    className="button button-outline"
                    onClick={exportQueries}
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
                    <div className="flex gap-2">
                        <button className="button" onClick={addQuery}>Save Query</button>
                        <button className="button button-outline" onClick={() => setShowAddForm(false)}>Cancel</button>
                    </div>
                </div>
            )}

            <div>
                {filteredQueries.map(query => (
                    <div key={query.id} className="card">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold">{query.name}</h3>
                                <div className="text-sm text-gray-500">
                                    Version {query.version} • {new Date(query.timestamp).toLocaleDateString()}
                                </div>
                                <div className="mt-2">
                                    {query.tags.map(tag => (
                                        <span key={tag} className="tag">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button 
                                    className="button button-outline"
                                    onClick={() => copyToClipboard(query.code)}
                                >
                                    Copy Code
                                </button>
                                <button 
                                    className="button button-outline"
                                    onClick={() => setEditingQuery(query)}
                                >
                                    Edit
                                </button>
                                <button 
                                    className="button button-outline"
                                    onClick={() => deleteQuery(query.id)}
                                >
                                    Delete
                                </button>
                                <button 
                                    className="button button-outline"
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
                                        <input
                                            type="text"
                                            value={editingQuery.name}
                                            onChange={(e) => setEditingQuery({...editingQuery, name: e.target.value})}
                                            className="w-full p-2 mb-4 border rounded"
                                        />
                                        <textarea
                                            value={editingQuery.code}
                                            onChange={(e) => setEditingQuery({...editingQuery, code: e.target.value})}
                                            className="w-full p-2 mb-4 border rounded font-mono"
                                            rows={5}
                                        />
                                        <textarea
                                            value={editingQuery.documentation}
                                            onChange={(e) => setEditingQuery({...editingQuery, documentation: e.target.value})}
                                            className="w-full p-2 mb-4 border rounded"
                                            rows={3}
                                        />
                                        <input
                                            type="text"
                                            value={editingQuery.tags.join(',')}
                                            onChange={(e) => setEditingQuery({...editingQuery, tags: e.target.value.split(',')})}
                                            className="w-full p-2 mb-4 border rounded"
                                        />
                                        <div className="flex gap-2">
                                            <button className="button" onClick={() => updateQuery(query.id)}>Save Changes</button>
                                            <button className="button button-outline" onClick={() => setEditingQuery(null)}>Cancel</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="mb-4">
                                            <h4 className="font-bold mb-2">Documentation</h4>
                                            <div className="bg-gray-50 p-3 rounded">
                                                {query.documentation}
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-bold mb-2">Code</h4>
                                            <pre className="code-block">
                                                <code className="language-sql">{query.code}</code>
                                            </pre>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

ReactDOM.render(<KQLQueryManager />, document.getElementById('root'));
