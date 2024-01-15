# Reasoning for Edge Delivery Server (EDS) Implementation

We aim to leverage Edge Delivery capabilities while enhancing key features integral to RAQN web:

1. **Component-Based Development:**
   We are adopting a component-based architecture to facilitate the addition of features as reusable components, moving away from the conventional composition of functions. This approach provides several advantages:
   - **Clear Component Life Cycle:** Components will have well-defined life cycles, making it easier to manage their behavior and interactions.
   - **Enforced Code Practices:** By structuring development around components, we enforce good coding practices, leading to cleaner and more maintainable code.
   - **Easy Reusability:** Components can be easily reused across various parts of the application, promoting a modular and scalable development approach.

2. **Authoring Theming Capabilities:**
   Our goal is to empower authors to create efficient and visually appealing websites without requiring a dedicated development team. This entails allowing the same code to be dynamically customized in terms of:
   - **Color Schemes:** Authors can easily change the color palette to match the branding or design preferences.
   - **Layout Composition:** Authors have the flexibility to adjust grid structures, margins, and borders to achieve the desired layout.
   - **Icon Customization:** The ability to change icons provides authors with creative control over visual elements.
   - **Font Selection:** Authors can choose different fonts to enhance the overall aesthetic.
   - **Specific Style Applications:** Authors can apply specific styles to components or elements, ensuring a tailored appearance.

3. **Fine-Grained Performance:**
   Similar to the theming concept, we aim to provide fine-grained control over the performance characteristics of the website. This involves tailoring the same codebase to accommodate variations in performance requirements without requiring additional development effort. The key requirements for achieving fine-grained performance include:
   - **Editorial Control Over LCP (Largest Contentful Paint):** Allowing editors to specify which components serve as the largest contentful paint on each page.
   - **Selective Eager Loading of Images:** Providing the capability to selectively load images eagerly based on editorial preferences and performance considerations.

In essence, our approach to EDS implementation revolves around empowering both developers and authors, ensuring a balance between flexibility and control. By embracing component-based development, authoring theming capabilities, and fine-grained performance tuning, we aim to create a platform that is not only powerful but also user-friendly and adaptable to diverse web development needs. As a proof of concept, we are recreating the [RAQN Guide](https://guide.raqn.io/) within the EDS framework.