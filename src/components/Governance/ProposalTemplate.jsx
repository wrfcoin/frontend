import React from 'react';
import { Link } from 'react-router';
import { WrfButton } from '../DesignSystem';
import './ProposalTemplate.css';

export const PROPOSAL_TEMPLATES = [
  {
    id: 'parameter-change',
    title: 'Parameter Change',
    description: 'Propose to modify a system parameter',
    icon: '⚙️',
    fields: [
      {
        name: 'parameterName',
        label: 'Parameter Name',
        type: 'select',
        required: true,
      },
      {
        name: 'currentValue',
        label: 'Current Value',
        type: 'text',
        readonly: true,
      },
      { name: 'newValue', label: 'New Value', type: 'text', required: true },
      {
        name: 'reason',
        label: 'Reason for Change',
        type: 'textarea',
        required: true,
      },
      {
        name: 'impact',
        label: 'Impact Analysis',
        type: 'textarea',
        required: true,
      },
    ],
    example: {
      title: 'Increase Minimum Staking Period',
      description:
        'Proposal to increase the minimum staking period from 7 days to 14 days to improve network stability.',
      parameterName: 'minStakingPeriod',
      currentValue: '7 days',
      newValue: '14 days',
      reason:
        'The current 7-day staking period has led to increased volatility in the validator set. By increasing to 14 days, we can improve network stability and reduce frequent validator turnover.',
      impact:
        'This change will affect all new staking positions. Existing staked positions will remain under the previous rules until manually renewed. Impact on network stability is expected to be positive, with a potential short-term decrease in new staking positions.',
    },
  },
  {
    id: 'protocol-upgrade',
    title: 'Protocol Upgrade',
    description: 'Propose a protocol upgrade or enhancement',
    icon: '🚀',
    fields: [
      { name: 'version', label: 'New Version', type: 'text', required: true },
      {
        name: 'changeType',
        label: 'Change Type',
        type: 'select',
        options: ['Major', 'Minor', 'Patch'],
        required: true,
      },
      {
        name: 'features',
        label: 'New Features',
        type: 'textarea',
        required: true,
      },
      {
        name: 'riskAssessment',
        label: 'Risk Assessment',
        type: 'textarea',
        required: true,
      },
      {
        name: 'testingResults',
        label: 'Testing Results',
        type: 'textarea',
        required: true,
      },
      {
        name: 'activationHeight',
        label: 'Activation Block Height',
        type: 'number',
        required: true,
      },
    ],
    example: {
      title: 'Upgrade to Wrfcoin Protocol v2.1.0',
      description:
        'This proposal introduces performance improvements and enhances the privacy features in the Wrfcoin protocol.',
      version: 'v2.1.0',
      changeType: 'Minor',
      features:
        '- Improved transaction throughput by 35%\n- Enhanced privacy features with optional stealth addresses\n- Reduced memory footprint for validators\n- Added new RPC endpoints for better developer experience',
      riskAssessment:
        'This upgrade has been thoroughly tested on three separate testnets. It is backward compatible with existing transactions and smart contracts. The main risk is potential temporary degradation of service during the upgrade window (estimated 5-10 minutes).',
      testingResults:
        'Load testing showed a 35% improvement in transaction processing rate without increased resource utilization. Security audits by CodeGuard and BlockSecure found no critical issues. Community testing involved 152 validators across three testnets for 14 days.',
      activationHeight: 2750000,
    },
  },
  {
    id: 'funding-request',
    title: 'Community Funding Request',
    description: 'Request funding from the community treasury',
    icon: '💰',
    fields: [
      {
        name: 'requestAmount',
        label: 'Requested Amount',
        type: 'number',
        required: true,
      },
      {
        name: 'projectType',
        label: 'Project Type',
        type: 'select',
        options: ['Development', 'Marketing', 'Research', 'Education', 'Other'],
        required: true,
      },
      {
        name: 'projectDescription',
        label: 'Project Description',
        type: 'textarea',
        required: true,
      },
      {
        name: 'budget',
        label: 'Budget Breakdown',
        type: 'textarea',
        required: true,
      },
      {
        name: 'timeline',
        label: 'Timeline & Milestones',
        type: 'textarea',
        required: true,
      },
      {
        name: 'team',
        label: 'Team & Qualifications',
        type: 'textarea',
        required: true,
      },
      {
        name: 'previousWork',
        label: 'Previous Work',
        type: 'textarea',
        required: false,
      },
    ],
    example: {
      title: 'Funding Request: Cross-Chain Interoperability Development',
      description:
        'Request for 50,000 WRF to fund the development of cross-chain bridges to Ethereum and Solana ecosystems.',
      requestAmount: 50000,
      projectType: 'Development',
      projectDescription:
        'This project aims to build secure, bidirectional bridge infrastructure between Wrfcoin and major blockchains (Ethereum and Solana). The bridges will enable asset transfers, cross-chain smart contract calls, and liquidity sharing between ecosystems. This will expand the utility of WRF tokens and bring more users and developers to the network.',
      budget:
        '- Developer salaries (3 full-time devs for 6 months): 35,000 WRF\n- Security audit by trusted third party: 10,000 WRF\n- Testing infrastructure and operational costs: 3,000 WRF\n- Bug bounty program: 2,000 WRF',
      timeline:
        '- Month 1-2: Architecture design and security model\n- Month 3-4: Implementation of Ethereum bridge\n- Month 5-6: Implementation of Solana bridge\n- Month 6: Security audits and public testnet\n- Month 7: Mainnet deployment',
      team: 'Our team consists of blockchain engineers with previous experience at Chainlink, Arbitrum, and Wormhole. The lead developer previously built the cross-chain messaging protocol used by three top 20 blockchains.',
      previousWork:
        'Our team previously built and deployed the WRFSwap decentralized exchange and the privacy layer for the Wrfcoin main protocol.',
    },
  },
  {
    id: 'text-proposal',
    title: 'Text Proposal',
    description: 'General governance proposal without on-chain execution',
    icon: '📝',
    fields: [
      { name: 'summary', label: 'Summary', type: 'textarea', required: true },
      {
        name: 'problemStatement',
        label: 'Problem Statement',
        type: 'textarea',
        required: true,
      },
      {
        name: 'proposedSolution',
        label: 'Proposed Solution',
        type: 'textarea',
        required: true,
      },
      { name: 'benefits', label: 'Benefits', type: 'textarea', required: true },
      {
        name: 'drawbacks',
        label: 'Potential Drawbacks',
        type: 'textarea',
        required: true,
      },
      {
        name: 'alternatives',
        label: 'Alternatives Considered',
        type: 'textarea',
        required: false,
      },
    ],
    example: {
      title: 'Implement Quadratic Voting for Governance Decisions',
      description:
        'A proposal to adopt quadratic voting for all future governance decisions to ensure more balanced representation.',
      summary:
        'This proposal suggests implementing quadratic voting for all governance decisions to prevent stake concentration from resulting in plutocracy and to ensure more balanced community representation.',
      problemStatement:
        'Currently, voting power is directly proportional to token holdings, which can lead to a small number of large token holders having outsized influence on governance decisions. This undermines the community-driven ethos of the project and discourages smaller stakeholders from participating.',
      proposedSolution:
        'Implement quadratic voting where voting power scales with the square root of token holdings rather than linearly. This means that while larger stakeholders still have more influence, the relationship is not proportional, giving more voice to smaller stakeholders while still rewarding token ownership.',
      benefits:
        '- More balanced representation across all token holders\n- Increased participation from smaller stakeholders\n- Protection against plutocracy or vote buying\n- Better alignment with community values\n- More diverse perspectives in decision-making',
      drawbacks:
        '- Increased complexity in voting mechanisms\n- Potential for Sybil attacks (mitigated by identity verification)\n- Possible resistance from larger stakeholders\n- Computational overhead in vote tallying',
      alternatives:
        'We also considered one-address-one-vote, delegation-based voting, and conviction voting. Quadratic voting provides the best balance between stakeholder incentives and democratic principles.',
    },
  },
  {
    id: 'network-upgrade',
    title: 'Network Infrastructure Upgrade',
    description: 'Propose improvements to the network infrastructure',
    icon: '🔄',
    fields: [
      {
        name: 'upgradeType',
        label: 'Upgrade Type',
        type: 'select',
        options: [
          'Consensus',
          'Storage',
          'Networking',
          'Virtual Machine',
          'Security',
        ],
        required: true,
      },
      {
        name: 'technicalDetails',
        label: 'Technical Details',
        type: 'textarea',
        required: true,
      },
      {
        name: 'benefits',
        label: 'Expected Benefits',
        type: 'textarea',
        required: true,
      },
      {
        name: 'requirements',
        label: 'Node Requirements',
        type: 'textarea',
        required: true,
      },
      {
        name: 'backwardsCompatibility',
        label: 'Backwards Compatibility',
        type: 'textarea',
        required: true,
      },
      {
        name: 'testnetResults',
        label: 'Testnet Results',
        type: 'textarea',
        required: true,
      },
    ],
    example: {
      title: 'Implement Zero-Knowledge Proof Validation Layer',
      description:
        'Add a zero-knowledge validation layer to enhance privacy and scaling capabilities of the Wrfcoin network.',
      upgradeType: 'Consensus',
      technicalDetails:
        'This upgrade adds a SNARKs-based validation layer that allows for private transaction validation without revealing transaction details. ' +
        'It employs the Groth16 proving system with a trusted setup ceremony conducted by 24 community participants. ' +
        'The ZK circuits are implemented in Rust and compiled to WebAssembly for cross-platform compatibility.',
      benefits:
        '- Enhanced transaction privacy\n- Reduced on-chain data requirements (approximately 65% reduction)\n- Increased throughput (from current ~500 TPS to ~1,800 TPS)\n- Support for complex privacy-preserving smart contracts',
      requirements:
        '- Validators will need minimum 8GB RAM (up from 4GB)\n- Additional 50GB storage for the initial proving key setup\n- New binary dependencies: libsnark (will be bundled with node software)',
      backwardsCompatibility:
        'This upgrade maintains full backwards compatibility with existing transactions. ' +
        'Old-style transactions will continue to work but won\'t benefit from the privacy enhancements. ' +
        'Smart contracts will need to opt-in to use the new ZK features.',
      testnetResults:
        'The zero-knowledge layer has been running on the Wrfcoin TestNet Beta for 3 months with 150 validators. ' +
        'Performance metrics show a 3.6x improvement in transaction throughput and a 65% reduction in chain state size ' +
        'for equivalent transaction volumes.',
    },
  },
];

/**
 * Proposal Templates Component
 * Displays a list of templates for creating governance proposals
 */
const ProposalTemplate = () => {
  return (
    <div className="proposal-templates">
      <div className="templates-header">
        <h2>Proposal Templates</h2>
        <p>
          Use these templates to create well-structured governance proposals.
          Templates provide recommended fields and format for different types of
          proposals.
        </p>
      </div>

      <div className="templates-grid">
        {PROPOSAL_TEMPLATES.map(template => (
          <div key={template.id} className="template-card">
            <div className="template-header">
              <span className="template-icon">{template.icon}</span>
              <h3>{template.title}</h3>
            </div>
            <p className="template-description">{template.description}</p>

            <div className="template-actions">
              <WrfButton
                variant="primary"
                component={Link}
                to={`/governance/proposals/new?template=${template.id}`}
              >
                Use Template
              </WrfButton>
              <WrfButton
                variant="outline"
                onClick={() =>
                  document
                    .getElementById(`example-${template.id}`)
                    .classList.toggle('show')
                }
              >
                View Example
              </WrfButton>
            </div>

            <div id={`example-${template.id}`} className="template-example">
              <h4>Example: {template.example.title}</h4>
              <p className="example-description">
                {template.example.description}
              </p>

              <div className="example-details">
                {Object.entries(template.example)
                  .filter(([key]) => !['title', 'description'].includes(key))
                  .map(([key, value]) => (
                    <div key={key} className="example-field">
                      <strong>
                        {key.charAt(0).toUpperCase() +
                          key.slice(1).replace(/([A-Z])/g, ' $1')}
                        :
                      </strong>
                      <div className="example-value">
                        {typeof value === 'string' && value.includes('\n') ? (
                          <ul>
                            {value.split('\n').map((line, i) => (
                              <li key={i}>{line.replace(/^- /, '')}</li>
                            ))}
                          </ul>
                        ) : (
                          <p>{value}</p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <WrfButton
                variant="outline"
                size="sm"
                onClick={() =>
                  document
                    .getElementById(`example-${template.id}`)
                    .classList.toggle('show')
                }
              >
                Close Example
              </WrfButton>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProposalTemplate;
