import React from "react"
import Header from './header'
import Footer from './footer'
import Widget from './widget'

const Layout = ({ isHomePage, children }) => {

  return (
    <div className="global-wrapper" data-is-root-path={isHomePage}>
      
      <Header isHomePage={isHomePage}/>

      <main>
        {isHomePage ? 
          <React.Fragment>
            <section>
              {children}
            </section>
            <Widget/>
          </React.Fragment>
          : <section className="alone">
              {children}
            </section>
        }
      </main>

      <Footer />

    </div>
  )
}

export default Layout
