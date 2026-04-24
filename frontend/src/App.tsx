import './App.css'

function App() {
  return (
    <div className="container">
      <h1 className="logo">Halfterm</h1>
      <p className="tagline">Find things to do with your kids</p>

      <div className="search-box">
        <div className="field">
          <label>What type of activity?</label>
          <select>
            <option>Museum</option>
          </select>
        </div>

        <div className="field">
          <label>Where abouts?</label>
          <select>
            <option>London</option>
          </select>
        </div>

        <div className="field">
          <label>When?</label>
          <select>
            <option>Today</option>
          </select>
        </div>

        <button className="search-btn">Search</button>
      </div>
    </div>
  )
}

export default App