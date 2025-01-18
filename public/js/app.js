document.addEventListener("DOMContentLoaded", () => {
  const navLinks = document.querySelectorAll(".nav a");
  const managementMenu = document.getElementById("management-menu");
  let loginOption = document.getElementById("login-option");
  let logoutOption = document.getElementById("logout-option");
  let manageExhibitionsOption = document.getElementById(
    "manage-exhibitions-option"
  );
  let manageLinksOption = document.getElementById("manage-links-option");
  const authForm = document.getElementById("authForm");
  const exhibitionsManagement = document.getElementById(
    "exhibitions-management"
  );
  const exhibitionForm = document.getElementById("exhibitionForm");
  const exhibitionsList = document.getElementById("exhibitionsList");
  const contentSections = document.querySelectorAll(".content-section");
  const paintingFilters = document.getElementById("painting-filters");

  const loginButton = document.getElementById("loginButton");
  const registerButton = document.getElementById("registerButton");

  let allPaintings = [];
  let loggedInUser = JSON.parse(sessionStorage.getItem("loggedInUser"));

  const toggleElementDisplay = (element, shouldShow) => {
    element.style.display = shouldShow ? "block" : "none";
  };

  const showSection = (section) => {
    contentSections.forEach((content) => toggleElementDisplay(content, false));

    clearSidebar();
    clearManagementContent();

    const activeContent = document.getElementById(`${section}-content`);
    if (activeContent) {
      toggleElementDisplay(activeContent, true);
    }

    if (section === "paintings") {
      addPaintingFiltersToSidebar();
    } else if (section === "management") {
      addManagementMenuToSidebar();
    } else if (section === "links") {
      addLinkFiltersToSidebar();
    }

    // Manage sidebar visibility based on the section
    toggleElementDisplay(managementMenu, section === "management");
    toggleElementDisplay(paintingFilters, section === "paintings");
    toggleElementDisplay(authForm, section === "management" && !loggedInUser);
    toggleElementDisplay(
      exhibitionsManagement,
      section === "management" && loggedInUser?.role === "admin"
    );
  };

  const toggleManagementMenu = () => {
    const isAuthenticated = !!loggedInUser;
    const isAdmin = loggedInUser?.role === "admin";

    // Show/Hide options based on user state
    toggleElementDisplay(loginOption, !isAuthenticated);
    toggleElementDisplay(logoutOption, isAuthenticated);

    // Show admin-specific options only for admins
    toggleElementDisplay(manageExhibitionsOption, isAdmin);
    toggleElementDisplay(manageLinksOption, isAdmin);
  };

  toggleManagementMenu();

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const section = link.dataset.section;

      showSection(section);
      localStorage.setItem("lastSectionAccessed", section);

      if (section === "paintings") {
        fetchPaintings();
      }

      if (section === "biography") {
        fetchBiography();
      }

      if (section === "links") {
        fetchLinks();
      }

      if (section === "exhibitions") {
        fetchExhibitionsForUsers();
      }
    });
  });

  loginOption.addEventListener("click", (e) => {
    e.preventDefault();
    toggleElementDisplay(authForm, true);
  });

  loginButton.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        loggedInUser = { username: data.username, role: data.role };
        sessionStorage.setItem("loggedInUser", JSON.stringify(loggedInUser));
        toggleManagementMenu();
        toggleElementDisplay(authForm, false);
        alert(`Welcome, ${loggedInUser.role === "admin" ? "Admin" : "User"}!`);
      } else {
        alert(data.message || "Login failed.");
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("An error occurred during login.");
    }
  });

  // Handle register
  registerButton.addEventListener("click", async () => {
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    if (!username || !password) {
      alert("Please enter both username and password.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      if (response.ok) {
        alert("Registration successful! You can now log in.");
        authForm.reset();
      } else {
        alert(data.message || "Registration failed.");
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("An error occurred during registration.");
    }
  });

  logoutOption.addEventListener("click", (e) => {
    e.preventDefault();
    loggedInUser = null;
    sessionStorage.removeItem("loggedInUser");
    toggleManagementMenu();
    alert("You have logged out.");
  });

  manageExhibitionsOption.addEventListener("click", (e) => {
    e.preventDefault();

    if (!loggedInUser || loggedInUser.role !== "admin") {
      alert("Unauthorized. Only admins can manage exhibitions.");
      return;
    }

    fetchExhibitions();
    toggleElementDisplay(exhibitionsManagement, true);
  });

  manageExhibitionsOption.addEventListener("click", (e) => {
    e.preventDefault();

    if (!loggedInUser || loggedInUser.role !== "admin") {
      alert("Unauthorized. Only admins can manage exhibitions.");
      return;
    }

    fetchExhibitions();
    toggleElementDisplay(exhibitionsManagement, true);
  });

  const fetchExhibitions = async () => {
    try {
      const response = await fetch("/api/exhibitions");
      const exhibitions = await response.json();

      document.getElementById("links-management").style.display = "none";
      document.getElementById("linksList").innerHTML = "";
      document.getElementById("linkForm").reset();
      exhibitionsList.innerHTML = "";
      exhibitions.forEach((ex) => {
        const li = document.createElement("li");
        li.innerHTML = `
            <strong>${ex.title}</strong> - ${ex.date}
            <p>${ex.description}</p>
            <button class='edit-button' onclick="editExhibition(${ex.id})">Edit</button>
            <button class='delete-button' onclick="deleteExhibition(${ex.id})">Delete</button>
          `;
        exhibitionsList.appendChild(li);
      });
    } catch (error) {
      console.error("Failed to fetch exhibitions:", error);
    }
  };

  exhibitionForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("exhibitionId").value;
    const title = document.getElementById("title").value;
    const description = document.getElementById("description").value;
    const date = document.getElementById("date").value;

    const method = id ? "PUT" : "POST";
    const url = id ? `/api/exhibitions/${id}` : "/api/exhibitions";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, date }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);
        fetchExhibitions();
        clearForm(exhibitionForm);
      } else {
        alert(data.message || "Error saving exhibition");
      }
    } catch (error) {
      console.error("Failed to save exhibition:", error);
    }
  });

  const clearForm = (form) => {
    form.reset();
    form.querySelectorAll("input[type=hidden]").forEach((hiddenField) => {
      hiddenField.value = "";
    });
  };

  window.editExhibition = (id) => {
    fetch(`/api/exhibitions`)
      .then((response) => response.json())
      .then((exhibitions) => {
        const exhibition = exhibitions.find((ex) => ex.id === id);
        if (!exhibition) {
          alert("Exhibition not found");
          return;
        }

        document.getElementById("exhibitionId").value = exhibition.id;
        document.getElementById("title").value = exhibition.title;
        document.getElementById("description").value = exhibition.description;
        document.getElementById("date").value = exhibition.date;
      });
  };

  window.deleteExhibition = async (id) => {
    try {
      const response = await fetch(`/api/exhibitions/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        alert("Exhibition deleted successfully");
        fetchExhibitions();
      } else {
        alert("Error deleting exhibition");
      }
    } catch (error) {
      console.error("Failed to delete exhibition:", error);
    }
  };

  // Fetch and display paintings
  const fetchPaintings = async () => {
    try {
      const response = await fetch("/api/paintings");
      if (!response.ok) {
        throw new Error(`Error fetching paintings: ${response.statusText}`);
      }

      allPaintings = await response.json();
      displayPaintings(allPaintings);
    } catch (error) {
      console.error("Failed to fetch paintings:", error);
      alert("Error loading paintings. Please try again later.");
    }
  };

  // Display paintings in grid
  const displayPaintings = (paintings) => {
    const paintingsGrid = document.getElementById("paintings-grid");
    paintingsGrid.innerHTML = "";

    paintings.forEach((painting) => {
      const card = document.createElement("div");
      card.classList.add("painting-card");
      card.innerHTML = `
      <img src="${painting.image}" alt="${painting.title}" />
      <h3>${painting.title}</h3>
      <p>Category: ${painting.category}</p>
    `;
      paintingsGrid.appendChild(card);
    });
  };

  const filterPaintings = (category) => {
    if (!allPaintings) {
      console.error("allPaintings is undefined");
      return;
    }

    if (category === "all") {
      displayPaintings(allPaintings);
    } else {
      const filteredPaintings = allPaintings.filter(
        (painting) => painting.category === category
      );
      displayPaintings(filteredPaintings);
    }
  };

  // Handle Paintings Filters
  paintingFilters.addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const category = e.target.dataset.category;
      filterPaintings(category, window.allPaintings);
    }
  });

  const fetchBiography = async () => {
    try {
      const response = await fetch("/api/biography");
      if (!response.ok) {
        throw new Error(`Error fetching biography: ${response.statusText}`);
      }

      const biography = await response.json();

      // Update biography content
      const biographyContent = document.getElementById("biography-content");
      biographyContent.innerHTML = `
        <h2>${biography.title}</h2>
        <img src="${biography.image}" alt="${biography.title}" style="max-width: 100%; height: auto; margin-bottom: 20px;">
        <p>${biography.content}</p>
      `;
    } catch (error) {
      console.error("Failed to fetch biography:", error);
      alert("Error loading biography. Please try again later.");
    }
  };

  const fetchLinks = async () => {
    try {
      const response = await fetch("/api/links");
      if (!response.ok) {
        throw new Error(`Error fetching links: ${response.statusText}`);
      }

      const { links, categories } = await response.json();

      // Store all links globally for filtering
      window.allLinks = links;

      // Display filters for public links
      displayLinkFilters(categories);

      // Display all links by default
      displayLinks(links);
    } catch (error) {
      console.error("Failed to fetch links:", error);
      alert("Error loading links. Please try again later.");
    }
  };

  const fetchLinksForManagement = async () => {
    try {
      const response = await fetch("/api/manage-links");
      if (!response.ok) {
        throw new Error(`Error fetching links: ${response.statusText}`);
      }

      const links = await response.json();

      // Display links for management
      displayLinksForManagement(links);
    } catch (error) {
      console.error("Failed to fetch links:", error);
      alert("Error loading links. Please try again later.");
    }
  };

  const displayLinks = (links) => {
    const linksContent = document.getElementById("links-content");
    if (!linksContent) {
      console.error("Links content element not found");
      return;
    }

    linksContent.innerHTML = "";

    links.forEach((category) => {
      const categoryDiv = document.createElement("div");
      categoryDiv.classList.add("link-category");

      categoryDiv.innerHTML = `
        <h3>${category.category}</h3>
        <ul>
          ${category.items
            .map(
              (link) =>
                `<li><a href="${link.url}" target="_blank">${link.name}</a></li>`
            )
            .join("")}
        </ul>
      `;

      linksContent.appendChild(categoryDiv);
    });
  };

  const displayLinkFilters = (categories) => {
    const filtersContainer = document.getElementById("link-filters");
    if (!filtersContainer) {
      console.error("Filters container not found");
      return;
    }

    filtersContainer.innerHTML = "";

    const allButton = document.createElement("button");
    allButton.textContent = "All";
    allButton.dataset.category = "all";
    filtersContainer.appendChild(allButton);

    // Add buttons for each category
    categories.forEach((category) => {
      const button = document.createElement("button");
      button.textContent = category;
      button.dataset.category = category;
      filtersContainer.appendChild(button);
    });

    // Show the filters in the sidebar
    filtersContainer.style.display = "block";
  };

  document.getElementById("link-filters").addEventListener("click", (e) => {
    if (e.target.tagName === "BUTTON") {
      const category = e.target.dataset.category;
      filterLinks(category, window.allLinks); // Pass the global `allLinks` for filtering
    }
  });

  const filterLinks = (category, allLinks) => {
    if (category === "all") {
      displayLinks(allLinks);
    } else {
      // Filter only the links in the selected category
      const filteredLinks = allLinks
        .map((group) => {
          if (group.category === category) {
            return group;
          }
          return null;
        })
        .filter((group) => group !== null);

      displayLinks(filteredLinks);
    }
  };

  const displayLinksForManagement = (links) => {
    const linksList = document.getElementById("linksList");
    if (!linksList) {
      console.error("Links list element not found");
      return;
    }
    document.getElementById("exhibitions-management").style.display = "none";
    document.getElementById("exhibitionsList").innerHTML = "";
    document.getElementById("exhibitionForm").reset();
    linksList.innerHTML = "";

    links.forEach((link) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${link.name}</strong> (${link.category || "Uncategorized"}) - 
        <a href="${link.url}" target="_blank">${link.url}</a>
        <button class='edit-button' onclick="editLink(${link.id})">Edit</button>
        <button class='delete-button' onclick="deleteLink(${
          link.id
        })">Delete</button>
      `;
      linksList.appendChild(li);
    });
  };

  const fetchExhibitionsForUsers = async () => {
    try {
      const response = await fetch("/api/exhibitions/public");
      if (!response.ok) {
        throw new Error(`Error fetching exhibitions: ${response.statusText}`);
      }

      const exhibitions = await response.json();
      displayExhibitions(exhibitions);
    } catch (error) {
      console.error("Failed to fetch exhibitions:", error);
      alert("Error loading exhibitions. Please try again later.");
    }
  };

  const displayExhibitions = (exhibitions) => {
    const exhibitionsContent = document.getElementById("exhibitions-content");
    exhibitionsContent.innerHTML = "";

    exhibitions.forEach((exhibition) => {
      const exhibitionDiv = document.createElement("div");
      exhibitionDiv.classList.add("exhibition-card");

      exhibitionDiv.innerHTML = `
        <h3>${exhibition.title}</h3>
        <p>${exhibition.description}</p>
        <p><strong>Date:</strong> ${new Date(
          exhibition.date
        ).toLocaleDateString()}</p>
      `;

      exhibitionsContent.appendChild(exhibitionDiv);
    });

    // Show the exhibitions content section
    showSection("exhibitions");
  };

  const addPaintingFiltersToSidebar = () => {
    const sidebar = document.querySelector(".aside");
    const paintingFilters = document.createElement("div");
    paintingFilters.id = "painting-filters";
    paintingFilters.innerHTML = `
      <h3>Filters</h3>
      <button data-category="all">All</button>
      <button data-category="landscape">Landscape</button>
      <button data-category="portrait">Portrait</button>
      <button data-category="abstract">Abstract</button>
    `;
    sidebar.appendChild(paintingFilters);

    paintingFilters.addEventListener("click", (e) => {
      if (e.target.tagName === "BUTTON") {
        const category = e.target.dataset.category;
        filterPaintings(category);
      }
    });
  };

  const addManagementMenuToSidebar = () => {
    const sidebar = document.querySelector(".aside");
    const managementMenu = document.createElement("div");
    managementMenu.id = "management-menu";
    managementMenu.innerHTML = `
      <ul id="management-options">
        <li><a href="#" id="login-option">Σύνδεση</a></li>
        <li style="display: none" id="logout-option"><a href="#">Logout</a></li>
        <li style="display: none" id="manage-exhibitions-option"><a href="#">Manage Exhibitions</a></li>
        <li style="display: none" id="manage-links-option"><a href="#">Manage Links</a></li>
      </ul>
    `;
    sidebar.appendChild(managementMenu);

    // Re-select the menu options after appending to DOM
    reinitializeManagementMenuElements();

    // Ensure the management menu is displayed based on user role
    toggleManagementMenu();
  };

  const reinitializeManagementMenuElements = () => {
    loginOption = document.getElementById("login-option");
    logoutOption = document.getElementById("logout-option");
    manageExhibitionsOption = document.getElementById(
      "manage-exhibitions-option"
    );
    manageLinksOption = document.getElementById("manage-links-option");

    loginOption?.addEventListener("click", (e) => {
      e.preventDefault();
      toggleElementDisplay(authForm, true);
    });

    logoutOption?.addEventListener("click", (e) => {
      e.preventDefault();
      loggedInUser = null;
      sessionStorage.removeItem("loggedInUser");
      toggleManagementMenu();
      window.location.reload();
    });

    manageExhibitionsOption?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!loggedInUser || loggedInUser.role !== "admin") {
        alert("Unauthorized. Only admins can manage exhibitions.");
        return;
      }
      fetchExhibitions();
      toggleElementDisplay(exhibitionsManagement, true);
    });

    manageLinksOption?.addEventListener("click", (e) => {
      e.preventDefault();
      if (!loggedInUser || loggedInUser.role !== "admin") {
        alert("Unauthorized. Only admins can manage links.");
        return;
      }

      // Fetch links specifically for management
      fetchLinksForManagement();

      // Show the management section
      toggleElementDisplay(document.getElementById("links-management"), true);
    });
  };

  document.getElementById("linkForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const id = document.getElementById("linkId").value;
    const name = document.getElementById("linkName").value;
    const url = document.getElementById("linkUrl").value;
    const category = document.getElementById("linkCategory").value;

    const method = id ? "PUT" : "POST";
    const endpoint = id ? `/api/links/${id}` : "/api/links";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, url, category }),
      });

      const data = await response.json();
      if (response.ok) {
        alert(data.message);

        document.getElementById("linkForm").reset();
        document.getElementById("linkId").value = "";

        fetchLinksForManagement();
      } else {
        alert(data.message || "Error saving link");
      }
    } catch (error) {
      console.error("Failed to save link:", error);
      alert("An error occurred. Please try again.");
    }
  });

  window.editLink = async (id) => {
    try {
      const response = await fetch(`/api/links/${id}`);
      if (!response.ok) throw new Error("Failed to fetch link details");

      const link = await response.json();
      document.getElementById("linkId").value = link.id;
      document.getElementById("linkName").value = link.name;
      document.getElementById("linkUrl").value = link.url;
      document.getElementById("linkCategory").value = link.category || "";
    } catch (error) {
      console.error("Failed to fetch link for editing:", error);
      alert("Error loading link details.");
    }
  };

  window.deleteLink = async (id) => {
    try {
      const response = await fetch(`/api/links/${id}`, { method: "DELETE" });
      if (response.ok) {
        alert("Link deleted successfully");
        fetchLinksForManagement();
      } else {
        alert("Error deleting link");
      }
    } catch (error) {
      console.error("Failed to delete link:", error);
      alert("An error occurred. Please try again.");
    }
  };

  const addLinkFiltersToSidebar = async () => {
    const sidebar = document.querySelector(".aside");
    const filtersContainer = document.createElement("div");
    filtersContainer.id = "link-filters";
    filtersContainer.innerHTML = `<h3>Filters</h3>`;
    sidebar.appendChild(filtersContainer);

    try {
      const response = await fetch("/api/links");
      const { categories } = await response.json();

      categories.forEach((category) => {
        const button = document.createElement("button");
        button.textContent = category;
        button.dataset.category = category;
        filtersContainer.appendChild(button);
      });

      filtersContainer.addEventListener("click", (e) => {
        if (e.target.tagName === "BUTTON") {
          const category = e.target.dataset.category;
          filterLinks(category, window.allLinks);
        }
      });
    } catch (error) {
      console.error("Failed to fetch links:", error);
    }
  };

  const clearManagementContent = () => {
    document.getElementById("links-management").style.display = "none";
    document.getElementById("linksList").innerHTML = "";
    document.getElementById("linkForm").reset();

    document.getElementById("exhibitions-management").style.display = "none";
    document.getElementById("exhibitionsList").innerHTML = "";
    document.getElementById("exhibitionForm").reset();
  };

  // keep track of last page user visited
  function lastAccessedSection() {
    const section = localStorage.getItem("lastSectionAccessed");

    if (section === "paintings") {
      showSection("paintings", true);
      fetchPaintings();
    }

    if (section === "biography") {
      showSection("biography", true);
      fetchBiography();
    }

    if (section === "links") {
      showSection("links", true);
      fetchLinks();
    }

    if (section === "management") {
      showSection("management", true);
      toggleManagementMenu();
    }
  }

  const clearSidebar = () => {
    const sidebar = document.querySelector(".aside");
    sidebar.innerHTML = "";
  };

  lastAccessedSection();
});
