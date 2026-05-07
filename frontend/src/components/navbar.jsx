import './navbar.css'

function Navbar() {
    return (
        <nav className="navbar">
            <div className="nav-container">
                <div className="nav-left">
                    <h1 className="logo">Technocode</h1>
                </div>
                
                <ul className="nav-links">
                    <li><a href="#" className="nav-item">Home</a></li>
                    <li className="dropdown">
                        <button className="nav-item dropdown-toggle">
                            Problems
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                        <div className="dropdown-menu">
                            <div className="dropdown-content">
                                <a href="#" className="dropdown-item">
                                    <div className="dropdown-text">
                                        <span className="dropdown-title">Features</span>
                                        <span className="dropdown-desc">Explore what we offer</span>
                                    </div>
                                </a>
                                <a href="#" className="dropdown-item">
                                    <div className="dropdown-text">
                                        <span className="dropdown-title">What's new</span>
                                        <span className="dropdown-desc">Latest updates</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </li>
                    <li><a href="#" className="nav-item">AI Interview</a></li>
                    <li><a href="#" className="nav-item">Products</a></li>
                    <li className="dropdown">
                        <button className="nav-item dropdown-toggle">
                            About
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="chevron-down"><path d="m6 9 6 6 6-6"/></svg>
                        </button>
                        <div className="dropdown-menu">
                            <div className="dropdown-content">
                                <a href="#" className="dropdown-item">
                                    <div className="dropdown-text">
                                        <span className="dropdown-title">Who we are</span>
                                        <span className="dropdown-desc">Meet the Tcode team</span>
                                    </div>
                                </a>
                                <a href="#" className="dropdown-item">
                                    <div className="dropdown-text">
                                        <span className="dropdown-title">Our Goals</span>
                                        <span className="dropdown-desc">Making of TechnoCode</span>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </li>
                </ul>
                
                <div className="nav-actions">
                    <button className="btn-secondary">Log in</button>
                    <button className="btn-primary">Sign up</button>
                </div>
            </div>
        </nav>
    )
}

export default Navbar