document.addEventListener('DOMContentLoaded', () => {

    // active nav tab stays in view on local
    const currentPage = window.location.pathname.split('/').pop()
    const activeNavLink = document.querySelector(`nav a[href="${currentPage}"]`)
    if (activeNavLink) {
        activeNavLink.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'center' })
        activeNavLink.parentElement.style.zIndex = '6'
    }

    // load skill bars for about page
    if (document.getElementById('skills-section')) {
        document.querySelectorAll('.skill-row').forEach((row) => {
            const level = parseInt(row.dataset.level)
            const dots = document.createElement('div')
            dots.className = 'skill-dots'
            for (let i = 0; i < 10; i++) {
                const dot = document.createElement('span')
                dot.className = i < level ? 'dot filled' : 'dot'
                dots.appendChild(dot)
            }
            row.appendChild(dots)
        })
    }

    // use typed.js for portfolio title animation
    if (document.querySelector('#title')) {
        const typed = new Typed('#title', {
            strings: ["Mandy's<br>Portfolio"],
            contentType: 'html',
            typeSpeed: 100,
            showCursor: false,
            onComplete: () => {
                const cursor = document.createElement('span')
                cursor.className = 'static-cursor'
                cursor.textContent = '|'
                document.querySelector('#title').appendChild(cursor)
            }
        })
    }

    // timeline scroll animation using GSAP
    if (typeof gsap !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger)
        gsap.set('.timeline-dot', { rotation: 45 })

        const timelineLine = document.querySelector('.timeline-line')

        gsap.from(timelineLine, {
            scaleY: 0,
            transformOrigin: 'top center',
            scrollTrigger: {
                trigger: '.timeline',
                start: 'top center',
                end: 'bottom center',
                scrub: true
            }
        })

        gsap.utils.toArray('.timeline-item').forEach((item) => {
            const isLeft = item.classList.contains('left')
            const dot = item.querySelector('.timeline-dot')
            const elements = item.querySelectorAll(
                '.timeline-content img, .timeline-content h3, .timeline-content h4, .timeline-content p'
            )

            const tl = gsap.timeline({
                scrollTrigger: {
                    trigger: item,
                    start: 'top 75%',
                    toggleActions: 'play reverse play reverse'
                }
            })

            tl.from(dot, 0.3, { scale: 0 })
              .from(elements, 0.5, { opacity: 0, x: isLeft ? -30 : 30, stagger: 0.3 }, '-=0.1')
        })

        // skills section animation 
        if (document.getElementById('skills-section')) {
            gsap.set('.dot', { rotation: 45 })

            gsap.from('.skill-category', 0.5, {
                opacity: 0,
                y: 20,
                stagger: 0.2,
                scrollTrigger: {
                    trigger: '#skills-section',
                    start: 'top 80%',
                    toggleActions: 'play reverse play reverse'
                }
            })

            gsap.utils.toArray('.skill-row').forEach((row) => {
                const dots = row.querySelectorAll('.dot')
                gsap.from(dots, 0.3, {
                    scale: 0,
                    stagger: 0.05,
                    ease: 'back.out(2)',
                    scrollTrigger: {
                        trigger: row,
                        start: 'top bottom',
                        toggleActions: 'play reverse play reverse'
                    }
                })
            })
        }

        // About Me / Skills divider dock effect
        if (document.getElementById('about-border')) {
            const border = document.getElementById('about-border')
            const isMobile = window.innerWidth <= 767
            const dotCount = isMobile ? 7 : 30
            const min = 35
            const max = 80
            const bound = min * Math.PI

            for (let i = 0; i < dotCount; i++) {
                const el = document.createElement('i')
                el.className = 'fa-solid fa-asterisk border-dot'
                border.appendChild(el)
            }

            const borderDots = border.querySelectorAll('.border-dot')
            gsap.set(borderDots, { transformOrigin: '50% 50%' })

            // always spinning in place
            gsap.to(borderDots, 2, { rotation: 360, repeat: -1, ease: 'none' })

            border.addEventListener('mousemove', (e) => {
                borderDots.forEach((dot) => {
                    const rect = dot.getBoundingClientRect()
                    const distance = (rect.left + rect.width / 2) - e.clientX
                    const scale = (-bound < distance && distance < bound)
                        ? 1 + (max / min - 1) * Math.cos(distance / min * 0.5)
                        : 1
                    gsap.to(dot, 0.3, { scale })
                })
            })

            border.addEventListener('mouseleave', () => {
                gsap.to(borderDots, 0.4, { scale: 1 })
            })
        }
    }

    // GitHub API
    if (document.getElementById('repo-grid')) {
        let activeFilter = 'all'

        const sanitizeClass = (str) =>
            str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

        const fetchRepos = async () => {
            const response = await fetch('https://api.github.com/users/MdyWg/repos?sort=updated&per_page=20')
            const repos = await response.json()
            return repos
        }

        const fetchLangs = async (repoName) => {
            const response = await fetch(`https://api.github.com/repos/MdyWg/${repoName}/languages`)
            const langs = await response.json()
            return langs
        }

        const renderCard = (repo, langs) => {
            const { html_url, name, description } = repo
            const langKeys = Object.keys(langs)
            const top3 = langKeys.sort((a, b) => langs[b] - langs[a]).slice(0, 3)
            const langClasses = langKeys.map(sanitizeClass).join(' ') || 'other'

            const tags = top3.length
                ? top3.map((l) => `<span class="lang-tag">${l}</span>`).join('')
                : '<span class="lang-tag">Other</span>'

            const cardHTML = `
                <div class="repo-card ${langClasses}">
                    <h3><a href="${html_url}" target="_blank">${name}</a></h3>
                    <p class="repo-desc">${description || 'No description'}</p>
                    <div class="repo-langs">${tags}</div>
                </div>`

            document.getElementById('repo-grid').insertAdjacentHTML('beforeend', cardHTML)
        }

        const renderFilters = (allLangs) => {
            const filterContainer = document.getElementById('lang-filters')
            Object.keys(allLangs).sort().forEach((lang) => {
                const btn = document.createElement('button')
                btn.className = 'lang-btn'
                btn.textContent = lang
                btn.dataset.lang = sanitizeClass(lang)
                filterContainer.appendChild(btn)
            })
        }

        // filter cards by active language and search query
        const applyFilter = () => {
            const query = document.getElementById('search-bar').value.toLowerCase().trim()
            document.querySelectorAll('.repo-card').forEach((card) => {
                const name = card.querySelector('h3 a').textContent.toLowerCase()
                const desc = card.querySelector('.repo-desc').textContent.toLowerCase()
                const matchesSearch = !query || name.includes(query) || desc.includes(query)
                const matchesLang = activeFilter === 'all' || card.classList.contains(activeFilter)
                const visible = matchesSearch && matchesLang

                card.style.display = visible ? '' : 'none'
            })
        }

        // fetch repos and languages then render everything
        const loadProjects = async () => {
            try {
                const repos = await fetchRepos()
                const allLangs = {}

                for (const repo of repos) {
                    const langs = await fetchLangs(repo.name)
                    renderCard(repo, langs)
                    Object.keys(langs).forEach((l) => { allLangs[l] = true })
                }

                renderFilters(allLangs)

                document.getElementById('lang-filters').addEventListener('click', (e) => {
                    if (!e.target.classList.contains('lang-btn')) return
                    document.querySelectorAll('.lang-btn').forEach((b) => b.classList.remove('active'))
                    e.target.classList.add('active')
                    activeFilter = e.target.dataset.lang || 'all'
                    applyFilter()
                })

                document.getElementById('search-bar').addEventListener('input', applyFilter)

            } catch (e) {
                document.getElementById('repo-grid').innerHTML = '<p>Could not load repositories.</p>'
            }
        }

        loadProjects()
    }

    // Copy email to clipboard (contact page)
    const copyText = (text) => {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.style.position = 'fixed'
        textarea.style.opacity = '0'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
    }

    document.querySelectorAll('.copy').forEach((el) => {
        el.addEventListener('click', () => {
            copyText(el.dataset.email)

            const popup = document.createElement('div')
            popup.className = 'copy-popup'
            popup.textContent = 'Copied!'

            const isMobile = window.innerWidth <= 767

            if (isMobile) {
                // insert between contact list and form so it doesn't cover the form
                const contactList = document.getElementById('contact-list')
                contactList.insertAdjacentElement('afterend', popup)
                popup.style.position = 'relative'
                popup.style.margin = '0.75rem auto'
                popup.style.width = 'fit-content'
            } else {
                document.body.appendChild(popup)
                const mask = el.closest('.icon-mask')
                const rect = mask.getBoundingClientRect()
                popup.style.left = `${rect.left + rect.width / 2 - popup.offsetWidth / 2}px`
                popup.style.top  = `${rect.bottom + 8}px`
            }

            requestAnimationFrame(() => popup.classList.add('show'))

            setTimeout(() => {
                popup.classList.remove('show')
                setTimeout(() => popup.parentNode.removeChild(popup), 200)
            }, 1500)
        })
    })

})
