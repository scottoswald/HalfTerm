// ---- ABOUT PAGE ----
// A simple page introducing Scott and the Halfterm project.
// Replace the placeholder text below with your own content.
// This page is linked from the header on App.tsx and Results.tsx.

// ---- HOW TO EDIT THIS PAGE ----
// Line breaks: add an empty <p> tag or use <br /> for a single line break
// Bold text: wrap in <strong>your text</strong>
// Italic text: wrap in <em>your text</em>
// New paragraph: wrap in <p className="...">your text</p>
// Links: use <a href="url" target="_blank" rel="noopener noreferrer">link text</a>

import { useNavigate } from 'react-router-dom'

function About() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-base-200">
      <div className="max-w-2xl mx-auto px-4 py-12">

        {/* Header */}
        <div className="text-center mb-10">
          <h1
            className="text-4xl font-black text-primary mb-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            Halfterm
          </h1>
          <p className="text-base-content/60">About this project</p>
        </div>

        {/* About the project */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl mb-3">About Halfterm</h2>

            {/* ---- REPLACE BELOW WITH YOUR PROJECT DESCRIPTION ---- */}           
            <p className="italic text-base-content/80 mb-3">
              Halfterm is an activity finder for families.
            </p>

            <p className="text-base-content/80 mb-3">
              My sister is one of the best mums I know (blatant bias from me there? Yes. Is it true though? Also yes). 
            </p>

            <p className="text-base-content/80 mb-3">
              She's caring, patient, fun, and above all - she knows all, ALL, of the niche / free / community-led / 
              actual-things-you’d-want-to-do-with-your-kids activities in her local area. So, when it comes to 
              finding things to do for her children, she’s on it.
            </p>

            <p className="text-base-content/80 mb-3">
              …But I’m an uncle.
            </p>

            <p className="text-base-content/80 mb-3">
              Don’t get me wrong, I love my nephew and niece, and I love spending time with them - but you won’t catch 
              me combing over local community-led blogs, local newspapers or parish notice boards when it comes to finding 
              fun activities to do for them.
            </p>

            <p className="text-base-content/80 mb-3">
              So I thought I’d use my skills as a software engineer (and be inspired by my lack of skills as a plan-ready 
              uncle) to come up with the one-stop shop for all things family activities. 
            </p>

            <p className="italic font-bold text-base-content/80 mb-3">
              Welcome to Halfterm.
            </p>
            {/* ---- END OF PROJECT DESCRIPTION ---- */}

          </div>
        </div>

        {/* About me */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl mb-3">About Me</h2>

            {/* ---- REPLACE BELOW WITH YOUR BIO ---- */}
            <p className="text-base-content/80 mb-3">
              I’m Scott, and before I made a transition into tech, I worked in the museum education sector for 10+ years, 
              and still freelance from time to time today, as it’s something I’m passionate about.
            </p>

            <p className="text-base-content/80 mb-3">
              Museums are a great free resource (well, in the UK at least…well, some are at least…well, for now at least) 
              for families. They often offer a wide variety of free activities for families, but families are none the wiser.
            </p>

            <p className="text-base-content/80 mb-3">
              This certainly isn’t the families’ fault and, to be fair, not even the museums’; with funding the way it is at 
              the moment. So it’s my mission to make these fantastic free resources readily signposted to everyone.
            </p>

            <p className="text-base-content/80 mb-3">
              But why stop at Museums?
            </p>

            <p className="text-base-content/80 mb-3">
              If I could do this for Museums, why not cater for other categories that families are interested in?
            </p>

            <p className="text-base-content/80 mb-3">
              <em>Halfterm</em> has grown into something that I care deeply about and I want to see it grow - so please do use it and 
              let me know your thoughts (see <strong>Feedback</strong> below)
            </p>
            {/* ---- END OF BIO ---- */}

          </div>
        </div>

        {/* Why 'Halfterm'? */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="text-xl font-bold mb-3">Why <em>Halfterm</em>?</h2>

            {/* ---- REPLACE BELOW WITH YOUR BIO ---- */}
            <p className="text-base-content/80 mb-3">
              The half term holidays were always the busiest at the museums I worked at.
            </p>

            <p className="text-base-content/80 mb-3">
              Why not the bigger holidays - Winter, Sprint and Summer? Well, families would have their plans figured out 
              months in advance: going on holuiday, seeing family…etc.
            </p>

            <p className="text-base-content/80 mb-3">
              The weekends? Families have their regular rituals: football practice, visit to Nan’s…
            </p>

            <p className="text-base-content/80 mb-3">
              But the half term holidays sit in that awkward part in the middle. One random, awkward week in October, February 
              and May which comes to many parents by surprise and makes them think, “Well…what should we do with the kids?”
            </p>

            <p className="text-base-content/80 mb-3">
              …and this is where I’d like to think this website comes in handy.
            </p>
            {/* ---- END OF BIO ---- */}

          </div>
        </div>

        {/* Tech stack */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl mb-3">Tech</h2>
            <h2 className="text-l font-bold mb-3">Built With</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {[
                'React', 'TypeScript', 'Vite', 'Tailwind CSS', 'DaisyUI',
                'Python', 'FastAPI', 'Claude AI (Haiku)', 'LangChain',
                'Google Places API', 'Ticketmaster API', 'Eventbrite API',
                'Skiddle API', 'Leaflet', 'Docker', 'Railway', 'GitHub Actions'
              ].map(tech => (
                <span key={tech} className="badge badge-outline badge-lg">
                  {tech}
                </span>
              ))}
            </div> 

            <h2 className="text-l font-bold mb-3">How It Works</h2>

            <p className="text-base-content/80 mb-3">
              I started this project simply - finding family activities happening in museums today - and it’s expanded from there.
            </p>

            <p className="text-base-content/80 mb-3">
              Using AI agents, APIs and Databases (if all of that is gibberish to you - don’t worry), I’ve created a way to find 
              multiple types of activities happening all over the UK.
            </p>

            <p className="text-base-content/80 mb-3">
              The website has undergone rigorous user testing, and this garnered genuinely feedback as a result. I have implemented 
              features that are useful for users, and refined some features that I didn’t think would be as popular as they turned 
              out to be! All of this to say that making the user’s experience as simple as possible is at the core of my mission.

            </p>

            <p className="text-base-content/80 mb-3">
              Although it’s still very much in its beginning stages, I see a great future for Halfterm. I’ve thrown all my eggs in 
              this project-basket as I truly am passionate for this and what it could become. There are many more bug fixes, 
              improvements, features and updates too come - so stay tuned.
            </p>

          </div>
        </div>

        {/* Links */}
        <div className="card bg-base-100 shadow-md mb-8">
          <div className="card-body">
            <h2 className="card-title text-xl mb-4">Links</h2>
            <div className="flex flex-col gap-3">
              <a
                href="https://github.com/scottoswald/HalfTerm"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                Halfterm on GitHub
              </a>
              <a
                href="https://github.com/scottoswald"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                </svg>
                My GitHub Profile
              </a>
              <a
                href="https://www.linkedin.com/in/scottooswald/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-outline gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
            </div>
          </div>
        </div>

        {/* Help? */}
        <div className="card bg-base-100 shadow-md mb-6">
          <div className="card-body">
            <h2 className="card-title text-xl mb-3">Help?</h2>

            <h2 className="text-l font-bold mb-3">If you're a user of the website...</h2>

            <p className="text-base-content/80 mb-3">
              If you’re using Halfterm, you’ll know more than me about what features are missing, need improving…etc.
            </p>

            <p className="text-base-content/80 mb-3">
              If you’d like to help out and write some feedback, please fill out the form below.
            </p>

            <p className="text-base-content/80 mb-3">
              (Most of it is in the style of, well, a form - so it’s your classic checkboxes essentially. If freeform 
              feedback is more your style however, no worries - there’s space at the end of the form for you to provide 
              something more of that ilk.)
            </p>

            <div className="mb-6 flex justify-center">
              
              <a
                href="https://docs.google.com/forms/d/e/1FAIpQLScuE7Xd5o8EbB9OpxKn073oLGNpk5iL5WtVth8rAbFYSuMgqw/viewform"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
              >
                Share your feedback
              </a>
            </div>

            <h2 className="text-l font-bold mb-3">If you're technically minded...</h2>

            <p className="text-base-content/80 mb-3">
              There’s still loads, LOADS of work to do as Halfterm is far from perfect.
            </p>

            <p className="text-base-content/80 mb-3">
              How do you find out about a free community-led softplay that’s only advertised of a rogue, out-of-date 
              Facebook group and how it on Halfterm? How do you scrape local blogs (…legally)?
            </p>

            <p className="text-base-content/80 mb-3">
              I genuinely don’t know, but I’m also genuinely eager to find out how.
            </p>

            <p className="text-base-content/80 mb-3">
              So, if you are an empathetic tech-ey person, and solving these problems sound like this is your jam, and you 
              don’t mind helping out for free and for no stakes in the (as of yet non-existent) business of Halfterm - 
              chuck us an email below.
            </p>

            <div className="flex justify-center">
              <a href="/contact" className="btn btn-primary">
                Get in touch
              </a>
            </div>

            {/* I'd like a box that you click to take you to the email your thoughts page */}

            {/* ---- END OF HELP ---- */}

          </div>
        </div>

        {/* Back to search */}
        <div className="text-center">
          <button onClick={() => navigate('/')} className="btn btn-primary">
            ← Back to search
          </button>
        </div>

      </div>
    </div>
  )
}

export default About
