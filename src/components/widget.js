import React from 'react';
import { Link, useStaticQuery, graphql } from "gatsby"


const Widget = (props) => {
    const data = useStaticQuery(graphql`
    query WidgetQuery {
        allWpTag {
          nodes {
            id
            name
            uri
          }
        }
        allWpCategory {
          nodes {
            id
            name
            uri
          }
        }
        allWpPost(
          filter: {date: {lte: "today"}}
          limit: 5
          sort: {order: DESC, fields: date}
        ) {
          nodes {
            id
            title
            uri
            date(fromNow: true)
          }
        }
      }      
  `)
      const tags = data.allWpTag.nodes;
      const categories = data.allWpCategory.nodes;
      const recentPosts = data.allWpPost.nodes;
      console.log (tags, categories)

    return (
        <aside className="Lateral-Widget">
            <ul>
                <li>
                <h3>Recents Posts</h3>
                    <ul>
                        {recentPosts.map((post) => (
                            <li><Link key={post.id} to={post.uri}>
                                {post.title} <span className="date"> ~ {post.date}</span>
                            </Link></li>
                        ))}
                    </ul>
                </li>
                <li>
                <h3>Categories</h3>
                    <ul>
                        {categories.map((categorie) => (
                            <li><Link key={categorie.id} to={categorie.uri}>
                                {categorie.name}
                            </Link></li>
                        ))}
                    </ul>
                </li>
                <li>
                <h3>Tags</h3>
                    <ul>
                        {tags.map((tag) => (
                            <li><Link key={tag.id} to={tag.uri}>
                                {tag.name}
                            </Link></li>
                        ))}
                    </ul>
                </li>
            </ul>
        </aside>
    )
}

export default Widget;