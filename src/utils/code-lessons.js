export const shiptivitasLesson = {
  id: 'shiptivitas-kanban',
  title: 'build a kanban board',
  description: 'Add drag-and-drop to a React shipping dashboard.',
  files: {
    'board.js': {
      language: 'javascript',
      readOnly: false,
      initial: `import React from 'react';
import Swimlane from './Swimlane';
import './Board.css';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    const clients = this.getClients();
    this.state = {
      clients: {
        backlog: clients.filter(client => !client.status || client.status === 'backlog'),
        inProgress: clients.filter(client => client.status && client.status === 'in-progress'),
        complete: clients.filter(client => client.status && client.status === 'complete'),
      }
    }
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    }
  }
  getClients() {
    return [
      ['1','Stark, White and Abbott','Cloned Optimal Architecture', 'in-progress'],
      ['2','Wiza LLC','Exclusive Bandwidth-Monitored Implementation', 'complete'],
      ['3','Nolan LLC','Vision-Oriented 4Thgeneration Graphicaluserinterface', 'backlog'],
      ['4','Thompson PLC','Streamlined Regional Knowledgeuser', 'in-progress'],
      ['5','Walker-Williamson','Team-Oriented 6Thgeneration Matrix', 'in-progress'],
      ['6','Boehm and Sons','Automated Systematic Paradigm', 'backlog'],
      ['7','Runolfsson, Hegmann and Block','Integrated Transitional Strategy', 'backlog'],
      ['8','Schumm-Labadie','Operative Heuristic Challenge', 'backlog'],
      ['9','Kohler Group','Re-Contextualized Multi-Tasking Attitude', 'backlog'],
      ['10','Romaguera Inc','Managed Foreground Toolset', 'backlog'],
      ['11','Reilly-King','Future-Proofed Interactive Toolset', 'complete'],
      ['12','Emard, Champlin and Runolfsdottir','Devolved Needs-Based Capability', 'backlog'],
      ['13','Fritsch, Cronin and Wolff','Open-Source 3Rdgeneration Website', 'complete'],
      ['14','Borer LLC','Profit-Focused Incremental Orchestration', 'backlog'],
      ['15','Emmerich-Ankunding','User-Centric Stable Extranet', 'in-progress'],
      ['16','Willms-Abbott','Progressive Bandwidth-Monitored Access', 'in-progress'],
      ['17','Brekke PLC','Intuitive User-Facing Customerloyalty', 'complete'],
      ['18','Bins, Toy and Klocko','Integrated Assymetric Software', 'backlog'],
      ['19','Hodkiewicz-Hayes','Programmable Systematic Securedline', 'backlog'],
      ['20','Murphy, Lang and Ferry','Organized Explicit Access', 'backlog'],
    ].map(companyDetails => ({
      id: companyDetails[0],
      name: companyDetails[1],
      description: companyDetails[2],
      status: companyDetails[3],
    }));
  }
  renderSwimlane(name, clients, ref) {
    return (
      <Swimlane name={name} clients={clients} dragulaRef={ref}/>
    );
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane('Backlog', this.state.clients.backlog, this.swimlanes.backlog)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('In Progress', this.state.clients.inProgress, this.swimlanes.inProgress)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('Complete', this.state.clients.complete, this.swimlanes.complete)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}`,
      solution: `import React from 'react';
import Dragula from 'dragula';
import 'dragula/dist/dragula.css';
import Swimlane from './Swimlane';
import './Board.css';

export default class Board extends React.Component {
  constructor(props) {
    super(props);
    const clients = this.getClients();
    this.state = {
      clients: {
        backlog: clients,
        inProgress: [],
        complete: [],
      }
    }
    this.swimlanes = {
      backlog: React.createRef(),
      inProgress: React.createRef(),
      complete: React.createRef(),
    }
  }
  getClients() {
    return [
      ['1','Stark, White and Abbott','Cloned Optimal Architecture', 'backlog'],
      ['2','Wiza LLC','Exclusive Bandwidth-Monitored Implementation', 'backlog'],
      ['3','Nolan LLC','Vision-Oriented 4Thgeneration Graphicaluserinterface', 'backlog'],
      ['4','Thompson PLC','Streamlined Regional Knowledgeuser', 'backlog'],
      ['5','Walker-Williamson','Team-Oriented 6Thgeneration Matrix', 'backlog'],
      ['6','Boehm and Sons','Automated Systematic Paradigm', 'backlog'],
      ['7','Runolfsson, Hegmann and Block','Integrated Transitional Strategy', 'backlog'],
      ['8','Schumm-Labadie','Operative Heuristic Challenge', 'backlog'],
      ['9','Kohler Group','Re-Contextualized Multi-Tasking Attitude', 'backlog'],
      ['10','Romaguera Inc','Managed Foreground Toolset', 'backlog'],
      ['11','Reilly-King','Future-Proofed Interactive Toolset', 'backlog'],
      ['12','Emard, Champlin and Runolfsdottir','Devolved Needs-Based Capability', 'backlog'],
      ['13','Fritsch, Cronin and Wolff','Open-Source 3Rdgeneration Website', 'backlog'],
      ['14','Borer LLC','Profit-Focused Incremental Orchestration', 'backlog'],
      ['15','Emmerich-Ankunding','User-Centric Stable Extranet', 'backlog'],
      ['16','Willms-Abbott','Progressive Bandwidth-Monitored Access', 'backlog'],
      ['17','Brekke PLC','Intuitive User-Facing Customerloyalty', 'backlog'],
      ['18','Bins, Toy and Klocko','Integrated Assymetric Software', 'backlog'],
      ['19','Hodkiewicz-Hayes','Programmable Systematic Securedline', 'backlog'],
      ['20','Murphy, Lang and Ferry','Organized Explicit Access', 'backlog'],
    ].map(companyDetails => ({
      id: companyDetails[0],
      name: companyDetails[1],
      description: companyDetails[2],
      status: companyDetails[3],
    }));
  }

  componentDidMount() {
    const containers = [
      this.swimlanes.backlog.current,
      this.swimlanes.inProgress.current,
      this.swimlanes.complete.current,
    ];
    this.drake = Dragula(containers);
    this.drake.on('drop', (el, target, source, sibling) => {
      this.updateStateFromDom();
    });
  }

  componentWillUnmount() {
    if (this.drake) this.drake.destroy();
  }

  findClientById(id) {
    const all = [
      ...this.state.clients.backlog,
      ...this.state.clients.inProgress,
      ...this.state.clients.complete,
    ];
    return all.find(client => client.id === id);
  }

  updateStateFromDom() {
    const laneConfigs = [
      { key: 'backlog', ref: this.swimlanes.backlog, status: 'backlog' },
      { key: 'inProgress', ref: this.swimlanes.inProgress, status: 'in-progress' },
      { key: 'complete', ref: this.swimlanes.complete, status: 'complete' },
    ];
    const newClients = { backlog: [], inProgress: [], complete: [] };
    laneConfigs.forEach(({ key, ref, status }) => {
      const cards = ref.current.querySelectorAll('.Card');
      newClients[key] = Array.from(cards).map(card => {
        const id = card.getAttribute('data-id');
        const client = this.findClientById(id);
        return { ...client, status };
      });
    });
    this.setState({ clients: newClients });
  }

  renderSwimlane(name, clients, ref) {
    return (
      <Swimlane name={name} clients={clients} dragulaRef={ref}/>
    );
  }

  render() {
    return (
      <div className="Board">
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-4">
              {this.renderSwimlane('Backlog', this.state.clients.backlog, this.swimlanes.backlog)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('In Progress', this.state.clients.inProgress, this.swimlanes.inProgress)}
            </div>
            <div className="col-md-4">
              {this.renderSwimlane('Complete', this.state.clients.complete, this.swimlanes.complete)}
            </div>
          </div>
        </div>
      </div>
    );
  }
}`,
    },
    'swimlane.js': {
      language: 'javascript',
      readOnly: true,
      initial: `import React from 'react';
import Card from './Card';
import './Swimlane.css';

export default class Swimlane extends React.Component {
  render() {
    const cards = this.props.clients.map(client => {
      return (
        <Card
          key={client.id}
          id={client.id}
          name={client.name}
          description={client.description}
          status={client.status}
        />
      );
    })
    return (
      <div className="Swimlane-column">
        <div className="Swimlane-title">{this.props.name}</div>
        <div className="Swimlane-dragColumn" ref={this.props.dragulaRef}>
          {cards}
        </div>
      </div>);
  }
}`,
    },
    'card.js': {
      language: 'javascript',
      readOnly: true,
      initial: `import React from 'react';
import './Card.css';

export default class Card extends React.Component {
  render() {
    let className = ['Card'];
    if (this.props.status === 'backlog') {
      className.push('Card-grey');
    } else if (this.props.status === 'in-progress') {
      className.push('Card-blue');
    } else if (this.props.status === 'complete') {
      className.push('Card-green');
    }
    return (
      <div className={className.join(' ')} data-id={this.props.id} data-status={this.props.status}>
        <div className="Card-title">{this.props.name}</div>
      </div>
    );
  }
}`,
    },
  },

  steps: [
    {
      id: 'explore',
      title: 'explore the codebase',
      instruction: 'The project has three files: board.js (brain), swimlane.js (column), card.js (task).\n\nRight now board.js splits tasks by their status in the constructor — backlog, in-progress, complete. Click through the files in the sidebar to see what each one does.\n\nWhen you are ready, click "check my work" to continue.',
      validate: () => true,
      hint: 'Just read. No code changes yet.',
      previewMode: 'filtered',
    },
    {
      id: 'backlog-all',
      title: 'start everything in backlog',
      instruction: 'The ticket says: "all tasks should now show in the backlog swimlane."\n\nIn board.js, change the constructor so every task starts in the backlog array. The other two arrays should be empty.\n\nAlso change every status in getClients() to "backlog" so the data matches.',
      targetFile: 'board.js',
      validate: (files) => {
        const b = files['board.js']
        return (
          b.includes('backlog: clients') &&
          b.includes('inProgress: []') &&
          b.includes('complete: []') &&
          b.includes("'backlog'") &&
          !b.includes("'in-progress'") &&
          !b.includes("'complete'")
        )
      },
      hint: 'Replace the three .filter() calls with: backlog: clients, inProgress: [], complete: []. Then change every 4th array element in getClients() to \'backlog\'.',
      previewMode: 'backlog-no-drag',
    },
    {
      id: 'import-dragula',
      title: 'import dragula',
      instruction: 'Dragula is already installed. You just need to import it.\n\nAdd two lines at the top of board.js:\n1. import Dragula from \'dragula\';\n2. import \'dragula/dist/dragula.css\';',
      targetFile: 'board.js',
      validate: (files) => {
        const b = files['board.js']
        return b.includes("import Dragula from 'dragula'") && b.includes("import 'dragula/dist/dragula.css'")
      },
      hint: 'Look at how React and Swimlane are imported. Do the same for Dragula and its CSS.',
      previewMode: 'backlog-no-drag',
    },
    {
      id: 'init-dragula',
      title: 'initialize dragula',
      instruction: 'Add a componentDidMount() method to Board. Inside it, create a Dragula instance and pass it the three container refs:\n\nthis.swimlanes.backlog.current\nthis.swimlanes.inProgress.current\nthis.swimlanes.complete.current',
      targetFile: 'board.js',
      validate: (files) => {
        const b = files['board.js']
        return b.includes('componentDidMount') && b.includes('Dragula(') && b.includes('this.swimlanes.backlog.current')
      },
      hint: 'this.drake = Dragula([this.swimlanes.backlog.current, this.swimlanes.inProgress.current, this.swimlanes.complete.current]);',
      previewMode: 'drag-no-sync',
    },
    {
      id: 'handle-drop',
      title: 'handle the drop',
      instruction: 'Dragula moves the DOM, but React does not know. On the next render, cards would snap back.\n\nListen for the "drop" event on this.drake. When it fires, read the DOM order of all three columns and rebuild state to match.\n\nYou will need:\n- findClientById(id)\n- updateStateFromDom()\n- querySelectorAll(\'.Card\') on each ref',
      targetFile: 'board.js',
      validate: (files) => {
        const b = files['board.js']
        return (
          b.includes("this.drake.on('drop'") &&
          b.includes('updateStateFromDom') &&
          b.includes('findClientById') &&
          b.includes("querySelectorAll('.Card')")
        )
      },
      hint: 'this.drake.on(\'drop\', () => this.updateStateFromDom()); In updateStateFromDom, loop over the three refs, query for .Card elements, map them to client objects by data-id, and setState.',
      previewMode: 'solved',
    },
    {
      id: 'cleanup',
      title: 'clean up on unmount',
      instruction: 'Add componentWillUnmount() to destroy the Dragula instance. This prevents memory leaks when the user navigates away.',
      targetFile: 'board.js',
      validate: (files) => {
        const b = files['board.js']
        return b.includes('componentWillUnmount') && b.includes('this.drake.destroy')
      },
      hint: 'if (this.drake) this.drake.destroy();',
      previewMode: 'solved',
    },
    {
      id: 'ship-it',
      title: 'ship it',
      instruction: 'All acceptance criteria should now pass:\n\n✅ All tasks show in backlog\n✅ Three swimlanes exist\n✅ Drag reorders within a lane\n✅ Drag moves between lanes\n✅ Color changes on status change\n\nTry the preview below. Drag cards between columns. Watch colors update.\n\nYou built a real frontend feature.',
      validate: () => true,
      hint: 'You are done. Explore the preview.',
      previewMode: 'solved',
    },
  ],
}

export const CODE_LESSONS = [shiptivitasLesson]
