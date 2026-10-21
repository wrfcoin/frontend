import React, { useState, useRef } from 'react';
import './GraphQLQueryInterface.css';

const GraphQLQueryInterface = ({ onQueryResult }) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const textareaRef = useRef(null);

  // Pre-built query templates for computational NFT marketplace
  const queryTemplates = {
    allNFTs: `query GetAllComputationalNFTs {
  computationalNFTs(limit: 10) {
    id
    nftId
    title
    description
    creator
    owner
    computationType
    computationModel
    resourceRequirements
    status
    accuracy
    reward
    createdAt
    region
  }
}`,

    nftsByType: `query GetNFTsByType($type: String!) {
  computationalNFTsByType(computationType: $type) {
    id
    nftId
    title
    description
    creator
    computationType
    computationModel
    accuracy
    reward
    status
    createdAt
  }
}`,

    nftsByRegion: `query GetNFTsByRegion($region: String!) {
  computationalNFTsByRegion(region: $region) {
    id
    nftId
    title
    description
    computationType
    region
    accuracy
    reward
    status
    resourceRequirements
    createdAt
  }
}`,

    blockchainMetrics: `query GetBlockchainMetrics {
  blockchainMetrics {
    blockHeight
    totalTransactions
    activeNodes
    averageBlockTime
    hashrate
    difficulty
    lastBlockTimestamp
    pendingTransactions
  }
}`,

    recentBlocks: `query GetRecentBlocks {
  latestBlocks(limit: 5) {
    id
    blockHeight
    blockHash
    timestamp
    miner
    transactionCount
    reward
    difficulty
  }
}`,

    governanceProposals: `query GetGovernanceProposals {
  activeGovernanceProposals {
    id
    proposalId
    title
    description
    proposer
    status
    totalVotes
    yesVotes
    noVotes
    endTime
    quorumPercentage
    approvalPercentage
  }
}`,

    miningPools: `query GetMiningPools {
  miningPools {
    id
    poolId
    name
    description
    operatorAddress
    feePercentage
    hashrate
    minerCount
    specialization
    status
  }
}`,

    userWallet: `query GetUserWallet($address: String!) {
  wallet(address: $address) {
    id
    address
    balance
    user {
      id
      username
      createdAt
    }
    transactions(limit: 10) {
      id
      txHash
      amount
      fee
      timestamp
      operationType
      status
    }
  }
}`,
  };

  const executeQuery = async () => {
    if (!query.trim()) {
      setError('Please enter a GraphQL query');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
        }),
      });

      const data = await response.json();

      if (data.errors) {
        setError(data.errors.map(err => err.message).join(', '));
      } else {
        setResult(data.data);
        if (onQueryResult) {
          onQueryResult(data.data);
        }
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTemplate = templateKey => {
    setQuery(queryTemplates[templateKey]);
    setSelectedTemplate(templateKey);
    setError(null);
    setResult(null);
  };

  const formatJSON = obj => {
    return JSON.stringify(obj, null, 2);
  };

  const insertTextAtCursor = text => {
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newQuery = query.substring(0, start) + text + query.substring(end);
    setQuery(newQuery);

    // Set cursor position after inserted text
    setTimeout(() => {
      textarea.selectionStart = textarea.selectionEnd = start + text.length;
      textarea.focus();
    }, 0);
  };

  return (
    <div className="graphql-query-interface">
      <div className="query-interface-header">
        <h3>🔍 GraphQL Query Interface</h3>
        <p>
          Explore your computational NFT marketplace with powerful GraphQL
          queries
        </p>
      </div>

      <div className="query-templates">
        <h4>📋 Query Templates</h4>
        <div className="template-buttons">
          {Object.entries(queryTemplates).map(([key, template]) => (
            <button
              key={key}
              className={`template-btn ${selectedTemplate === key ? 'active' : ''}`}
              onClick={() => loadTemplate(key)}
              title={`Load ${key} query template`}
            >
              {key
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase())}
            </button>
          ))}
        </div>
      </div>

      <div className="query-helpers">
        <h4>🛠️ Quick Inserts</h4>
        <div className="helper-buttons">
          <button onClick={() => insertTextAtCursor('id\n    ')}>Add ID</button>
          <button onClick={() => insertTextAtCursor('createdAt\n    ')}>
            Add Created At
          </button>
          <button onClick={() => insertTextAtCursor('status\n    ')}>
            Add Status
          </button>
          <button onClick={() => insertTextAtCursor('(limit: 10)')}>
            Add Limit
          </button>
        </div>
      </div>

      <div className="query-editor">
        <h4>📝 GraphQL Query Editor</h4>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Enter your GraphQL query here..."
          className="query-textarea"
          rows={12}
        />

        <div className="query-actions">
          <button
            onClick={executeQuery}
            disabled={loading || !query.trim()}
            className="execute-btn"
          >
            {loading ? '⏳ Executing...' : '▶️ Execute Query'}
          </button>

          <button
            onClick={() => {
              setQuery('');
              setResult(null);
              setError(null);
              setSelectedTemplate('');
            }}
            className="clear-btn"
          >
            🗑️ Clear
          </button>
        </div>
      </div>

      {error && (
        <div className="query-error">
          <h4>❌ Error</h4>
          <pre>{error}</pre>
        </div>
      )}

      {result && (
        <div className="query-result">
          <h4>✅ Query Result</h4>
          <div className="result-summary">
            {Object.keys(result).map(key => (
              <span key={key} className="result-key">
                {key}:{' '}
                {Array.isArray(result[key])
                  ? `${result[key].length} items`
                  : 'object'}
              </span>
            ))}
          </div>
          <pre className="result-json">{formatJSON(result)}</pre>
        </div>
      )}

      <div className="query-documentation">
        <h4>📚 Available Types & Queries</h4>
        <div className="doc-grid">
          <div className="doc-section">
            <h5>🧮 Computational NFTs</h5>
            <ul>
              <li>computationalNFTs(limit, offset)</li>
              <li>computationalNFTsByType(computationType)</li>
              <li>computationalNFTsByRegion(region)</li>
              <li>computationalNFTsByCreator(address)</li>
            </ul>
          </div>

          <div className="doc-section">
            <h5>⛓️ Blockchain Data</h5>
            <ul>
              <li>blocks(limit, offset)</li>
              <li>latestBlocks(limit)</li>
              <li>transactions(limit, offset)</li>
              <li>blockchainMetrics</li>
            </ul>
          </div>

          <div className="doc-section">
            <h5>🏛️ Governance</h5>
            <ul>
              <li>governanceProposals(limit)</li>
              <li>activeGovernanceProposals</li>
              <li>proposalVotes(proposalId)</li>
            </ul>
          </div>

          <div className="doc-section">
            <h5>⛏️ Mining & Wallets</h5>
            <ul>
              <li>miningPools</li>
              <li>wallet(address)</li>
              <li>user(id)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GraphQLQueryInterface;
