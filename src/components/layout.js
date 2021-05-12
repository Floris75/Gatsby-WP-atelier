import React from "react"
import Header from './header'
import Footer from './footer'

const Layout = ({ isHomePage, children }) => {

  return (
    <div className="global-wrapper" data-is-root-path={isHomePage}>
      
      <Header isHomePage={isHomePage}/>

      <main>{children}</main>

      <Footer />

    </div>
  )
}

export default Layout
