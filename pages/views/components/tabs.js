function Tabs() {
    const [activeTab, setActiveTab] = React.useState('drafts');
  
    React.useEffect(() => {
    console.log("Current Active Tab", activeTab)
    
      // Hide all tab content
      document.querySelectorAll('.tab-pane').forEach(el => {
        el.classList.remove('active');
      });

      // Show active tab content -- I probably don't need this if I set up the CSS properly
      const currentTabContent = document.getElementById(`${activeTab}-content`)
      if(!currentTabContent) return

      currentTabContent.classList.toggle('show');
    }, [activeTab]);
  
    return (
        <div className="columns has-sections">
            <h2>Recovery Types</h2>
            <ul className="tabs">
                <li
                    className="active tab-pane"
                    id="drafts"
                    // className={activeTab === 'drafts' ? 'active' : ''}
                    onClick={() => setActiveTab('drafts')}>
                    Draft Orders
                </li>
                <li
                    className="tab-pane"
                    id="orders"
                    //className={activeTab === 'orders' ? 'active' : ''}
                    onClick={() => setActiveTab('orders')}
                >
                    Orders
                </li>
                <li
                    className="tab-pane"
                    id="checkouts"
                    // className={activeTab === 'checkouts' ? 'active' : ''}
                    onClick={() => setActiveTab('checkouts')}
                >
                    Abandoned Checkouts
                </li>
            </ul>
        </div>
    );
  }


ReactDOM.render(<Tabs />, document.querySelector("#tabs"))