import React from 'react'
import { Link, useStaticQuery, graphql } from "gatsby"

const Nav = (props) => {
    const data = useStaticQuery(graphql`
    query MyQuery {
        wpMenu(name: {eq: "main"}) {
          menuItems {
            nodes {
              id
              label
              url
            }
          }
        }
      }      
  `)
  const menu = data.wpMenu.menuItems.nodes

    return (
        <nav>
            {menu.map((link) => <Link key={link.id} to={link.url}>{link.label}</Link> )}
        </nav>
    )
}

export default Nav;