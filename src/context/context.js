import React, { useState, useEffect } from 'react'
import mockUser from './mockData.js/mockUser'
import mockRepos from './mockData.js/mockRepos'
import mockFollowers from './mockData.js/mockFollowers'
import axios from 'axios'

const rootUrl = 'https://api.github.com'

const GithubContext = React.createContext()

const GithubProvider = ({ children }) => {
  const [githubUser, setGithubUser] = useState(mockUser)
  const [followers, setFollowers] = useState(mockFollowers)
  const [repos, setRepos] = useState(mockRepos)
  const [user, setUser] = useState('')
  const [requestsLimit, setRequestsLimt] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState({ isError: false, errorMsg: '' })

  const toggleError = (isError = false, errorMsg: '') => {
    setError({
      isError,
      errorMsg,
    })
  }

  const checkRequests =()=> {
    axios(`${rootUrl}/rate_limit`).then(response=> {
      const {data} = response;
      let {remaining} = data.rate;
      setRequestsLimt(remaining);
      if(remaining === 0) {
        toggleError(true, 'you have used your hourly request rate')
      }
      
    })
  }
useEffect(checkRequests,[])

  const handleChange = (e) => {
    setUser(e.target.value)
  }

const fetchUser = async()=> {
  setIsLoading(true);
  toggleError();
  const response = await axios(`${rootUrl}/users/${user}`).catch(error=> console.log(error));
  if(response) {
    const {data} = response;
    setGithubUser(data);
    const {login,repos_url } = data;
    // axios(`${rootUrl}/users/${login}/followers?per_page=100`).then(response=> {
    //   setFollowers(response.data)
    // }).catch(error=> console.log(error));
    // axios(`${repos_url}?per_page=100`).then(response=> {
    //   setRepos(response.data)
    // }).catch(error=> console.log(error))
    await Promise.allSettled([
      axios(`${rootUrl}/users/${login}/followers?per_page=100`),
      axios(`${repos_url}?per_page=100`),
    ]).then(([followers, repos])=> {
      const status= 'fulfilled'
      if(followers.status === status) {
        setFollowers(followers.value.data)
      }
      if(repos.status === status) {
        setRepos(repos.value.data)
      }
    }).catch(error=> console.log(error));
  }
  else {
    toggleError(true, 'There Is No User With That Username');
  }
  setIsLoading(false)
  checkRequests()
}

  const handleSubmit = (e) => {
    e.preventDefault();
    if(user) {
      fetchUser()
    }
  }
  return (
    <GithubContext.Provider
      value={{
        githubUser,
        followers,
        repos,
        user,
        requestsLimit,
        isLoading,
        ...error,
        handleChange,
        handleSubmit
      }}
    >
      {children}
    </GithubContext.Provider>
  )
}

const useGlobalContext = () => {
  return React.useContext(GithubContext)
}

export { useGlobalContext, GithubProvider }
