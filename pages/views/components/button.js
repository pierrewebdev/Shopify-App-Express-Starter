const AlertButton = () => {
    const handleClick = () => {
      alert('Hello from React');
    };
  
    return (
      <button 
        onClick={handleClick}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
      >
        Click Me
      </button>
    );
};

ReactDOM.render(<AlertButton />, document.querySelector("#react-btn"))
