import React from 'react'
import { Link, useStaticQuery, graphql } from "gatsby"
import Nav from './navigation'

const Header = (props) => {
    const {isHomePage} = props;
    const data = useStaticQuery(graphql`
    query HeaderQuery {
      wp {
        generalSettings {
          title
          description
        }
      }
    }
  `)
  const description = data.wp.generalSettings.description
  const title = data.wp.generalSettings.title
    return (
        <header className="global-header" id="header">
        {isHomePage ? (
          <h1 className="main-heading">
            <Link to="/">{title}</Link>
          </h1> 
        ) : (
          <Link className="header-link-home" id="title" to="/">
            {title}
          </Link>
        )}
        <Nav/>
        <p>{description}</p>
      </header>
    )
}

export default Header;