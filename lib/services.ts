export interface Service {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  items: ServiceItem[];
  sections: ServiceSection[];
}

export interface ServiceItem {
  title: string;
  description: string;
  icon?: string;
}

export interface ServiceSection {
  heading: string;
  description: string;
  details: string[];
}

export const services: Service[] = [
  {
    id: '1',
    slug: 'website-performance-optimization',
    title: 'Website Performance Optimization',
    subtitle: 'Enhancing Speed, Efficiency, and User Experience',
    description: 'Optimize your website\'s speed and efficiency to deliver exceptional user experiences and improve business outcomes.',
    sections: [
      {
        heading: 'Definition',
        description: 'Performance optimization improves how fast and smoothly your website behaves for real visitors.',
        details: [
          'Analyze page load times, interactive readiness, and resource delivery across devices.',
          'Identify bottlenecks in images, code, server responses, and content delivery.',
          'Apply targeted improvements so the site feels faster and more reliable for users.',
        ],
      },
      {
        heading: 'Why It Matters',
        description: 'Slow performance damages user trust, reduces traffic value, and weakens search visibility.',
        details: [
          'Visitors abandon slow pages quickly, which lowers engagement and conversions.',
          'Search engines reward faster websites, so performance affects organic reach.',
          'Poor performance increases operational costs and creates a worse brand experience.',
        ],
      },
      {
        heading: 'How It Works',
        description: 'We follow a systematic performance process that measures, fixes, and validates real improvements.',
        details: [
          'Start with a performance audit to benchmark load times, interactivity, and responsiveness.',
          'Resolve issues in assets, hosting, caching, and code execution to reduce delays.',
          'Test outcomes to confirm the website feels faster and more stable under real conditions.',
        ],
      },
      {
        heading: 'Impact / Benefits',
        description: 'Faster websites deliver stronger engagement, improved conversions, and lower operational strain.',
        details: [
          'Users stay longer and interact more when pages load quickly and consistently.',
          'Higher performance supports better conversion rates and lowers bounce behavior.',
          'Efficient websites require fewer server resources and are easier to maintain over time.',
        ],
      },
      {
        heading: 'Strategic Insight',
        description: 'Effective optimization is a strategic asset, not a one-time technical tweak.',
        details: [
          'Build performance into the website from design through deployment, rather than patching it later.',
          'Focus on user experience metrics that matter to customers, not just technical scores.',
          'Use ongoing monitoring to keep performance strong as the website grows and changes.',
        ],
      },
      {
        heading: 'Conversion Section',
        description: 'If your website is underperforming, data-driven optimization can recover value quickly.',
        details: [
          'We identify the highest-impact performance issues affecting your users.',
          'We implement improvements that reduce load time and increase page responsiveness.',
          'We help your website deliver a more polished digital experience that supports business goals.',
        ],
      },
    ],
    items: [
      {
        title: 'Load Time Optimization',
        description: 'Reduce page load times through server optimization, caching strategies, and efficient resource delivery. Fast loading is fundamental to user satisfaction and search engine rankings.',
      },
      {
        title: 'Image and Asset Optimization',
        description: 'Compress and optimize images, CSS, JavaScript, and other assets to minimize file sizes without compromising quality. Modern formats and responsive techniques ensure optimal delivery across all devices.',
      },
      {
        title: 'Code Efficiency',
        description: 'Streamline code through minification, removal of unused elements, and improved algorithms. Clean, efficient code reduces processing time and improves overall responsiveness.',
      },
      {
        title: 'Server and Infrastructure Tuning',
        description: 'Configure servers, databases, and content delivery networks for maximum efficiency. Proper infrastructure ensures reliable performance under varying traffic conditions.',
      },
      {
        title: 'Monitoring and Maintenance',
        description: 'Implement continuous monitoring systems to track performance metrics and identify issues before they impact users. Regular maintenance ensures sustained optimization.',
      },
    ],
  },
  {
    id: '2',
    slug: 'lead-generation-strategy',
    title: 'Lead Generation Strategy',
    subtitle: 'Systematic Approach to Attracting and Converting Prospects',
    description: 'Develop comprehensive strategies to attract qualified leads and convert them into valuable business opportunities.',
    sections: [
      {
        heading: 'Definition',
        description: 'Lead generation strategy creates repeatable systems for attracting qualified prospects to your business.',
        details: [
          'Define your ideal customer and what motivates them to engage with your brand.',
          'Develop offers, content, and channels that match those prospects at each stage of their decision process.',
          'Build coordinated touchpoints that move prospects from awareness to meaningful interest.',
        ],
      },
      {
        heading: 'Why It Matters',
        description: 'Without a structured approach, lead generation becomes inconsistent and costly.',
        details: [
          'Unplanned outreach produces low-quality leads that waste sales effort.',
          'Inconsistent lead flow makes revenue forecasts unreliable and growth harder to manage.',
          'A data-driven strategy helps you invest in the channels that deliver real business value.',
        ],
      },
      {
        heading: 'How It Works',
        description: 'We develop a lead generation system grounded in audience insight, content, and measurement.',
        details: [
          'Research your target audience and map the customer journey from first contact to conversion.',
          'Create content, offers, and web experiences that attract and qualify interested prospects.',
          'Use tracking and analytics to refine the strategy based on what actually generates leads.',
        ],
      },
      {
        heading: 'Impact / Benefits',
        description: 'A strong lead generation strategy improves both the quality and predictability of incoming prospects.',
        details: [
          'Sales teams receive better-qualified leads, shortening the sales cycle.',
          'Marketing investment becomes easier to evaluate and optimize over time.',
          'Sustainable lead flow supports more confident planning and faster growth.',
        ],
      },
      {
        heading: 'Strategic Insight',
        description: 'We treat lead generation as an integrated business system rather than a set of isolated campaigns.',
        details: [
          'Each touchpoint is designed to reinforce the next, so prospects advance naturally through the funnel.',
          'Quality is prioritized over volume to improve conversion efficiency and long-term value.',
          'Personalization and automation are used to maintain momentum without manual effort.',
        ],
      },
      {
        heading: 'Conversion Section',
        description: 'Set up a lead generation system that reliably brings qualified prospects to your sales pipeline.',
        details: [
          'We assess your current lead sources and identify the most promising improvements.',
          'We build and activate a connected process that converts attention into qualified interest.',
          'We track performance so your lead generation becomes a repeatable business asset.',
        ],
      },
    ],
    items: [
      {
        title: 'Audience Research and Personas',
        description: 'Deep analysis of target markets to create detailed buyer personas that inform all lead generation activities. Understanding your audience enables precise targeting and messaging.',
      },
      {
        title: 'Content Marketing Strategy',
        description: 'Development of valuable content that attracts and educates prospects, positioning your business as a trusted authority while capturing lead information.',
      },
      {
        title: 'Multi-Channel Integration',
        description: 'Coordinated use of website, email, social media, paid advertising, and partnerships to create multiple touchpoints that guide prospects toward conversion.',
      },
      {
        title: 'Lead Nurturing Systems',
        description: 'Automated sequences that maintain engagement with prospects who aren\'t immediately ready to purchase, building relationships over time.',
      },
      {
        title: 'Analytics and Optimization',
        description: 'Comprehensive tracking and analysis of lead generation performance, with data-driven refinements to improve results continuously.',
      },
    ],
  },
  {
    id: '3',
    slug: 'seo-growth-strategy',
    title: 'SEO Growth Strategy',
    subtitle: 'Long-Term Approach to Organic Search Visibility',
    description: 'Build sustainable organic search presence through strategic optimization and content development.',
    sections: [
      {
        heading: 'Definition',
        description: 'SEO growth strategy is a long-term plan to increase organic search visibility and attract relevant traffic.',
        details: [
          'Combine technical optimization, content, and authority-building to improve search rankings.',
          'Focus on sustainable improvements that earn traffic over time rather than short-term boosts.',
          'Build a website foundation that search engines and users both understand and trust.',
        ],
      },
      {
        heading: 'Why It Matters',
        description: 'Without a growth-focused SEO plan, organic search remains an underused and unstable channel.',
        details: [
          'Organic search captures users who are actively seeking solutions, making it a high-intent source.',
          'Competitors with better SEO will take the visibility and leads you could have earned.',
          'Long-term organic traffic reduces dependence on paid campaigns and improves ROI.',
        ],
      },
      {
        heading: 'How It Works',
        description: 'A strong SEO strategy blends audit, optimization, content, and ongoing measurement.',
        details: [
          'Start with an audit that identifies technical issues, content gaps, and competitive opportunities.',
          'Create and optimize content that aligns with search intent and customer needs.',
          'Monitor results and adapt as search behavior, algorithms, and market dynamics change.',
        ],
      },
      {
        heading: 'Impact / Benefits',
        description: 'Strategic SEO produces compounding gains in traffic, credibility, and long-term revenue.',
        details: [
          'Steady organic traffic lowers customer acquisition costs over time.',
          'Higher visibility builds authority and trust in your market.',
          'Sustainable rankings provide a predictable source of qualified visitors.',
        ],
      },
      {
        heading: 'Strategic Insight',
        description: 'We design SEO around connected content ecosystems rather than isolated page tactics.',
        details: [
          'Interconnected content helps search engines understand your expertise and relevance.',
          'We align SEO improvements with overall user experience, not just ranking signals.',
          'This approach supports resilient organic growth even as search engines evolve.',
        ],
      },
      {
        heading: 'Conversion Section',
        description: 'Grow organic search as a reliable, high-value channel for attracting customers.',
        details: [
          'We identify the most impactful keyword opportunities for your business.',
          'We develop content and technical changes that improve your visibility sustainably.',
          'We track progress so SEO becomes a dependable growth engine, not a guessing game.',
        ],
      },
    ],
    items: [
      {
        title: 'Technical SEO Foundation',
        description: 'Optimization of website structure, speed, mobile compatibility, and technical elements that form the foundation of search engine visibility.',
      },
      {
        title: 'Content Strategy Development',
        description: 'Creation of comprehensive, authoritative content that addresses user needs and earns search engine recognition and external links.',
      },
      {
        title: 'Keyword Research and Targeting',
        description: 'Systematic identification of valuable search terms and topics that align with business objectives and user search behavior.',
      },
      {
        title: 'Link Building and Authority',
        description: 'Strategic development of external references and relationships that enhance domain authority and search rankings.',
      },
      {
        title: 'Performance Monitoring',
        description: 'Ongoing tracking of SEO metrics, ranking changes, and traffic patterns with data-driven optimization adjustments.',
      },
    ],
  },
  {
    id: '4',
    slug: 'seo-optimization',
    title: 'SEO Optimisation',
    subtitle: 'Improving Visibility on Search Engines',
    description: 'SEO Optimisation improves how your website appears in search engine results.',
    sections: [
      {
        heading: 'What is SEO Optimisation?',
        description: 'SEO optimisation helps search engines understand and rank your website more effectively.',
        details: [
          'Improve your website\'s content, structure, and metadata so search engines can interpret it correctly.',
          'Enhance page relevance for the queries your customers actually use.',
          'Create a foundation for sustainable organic visibility without relying on paid ads.',
        ],
      },
      {
        heading: 'How Search Engines Understand Websites',
        description: 'Search engines analyze page structure, content, and technical quality before ranking your site.',
        details: [
          'Crawlers read titles, headings, body content, and metadata to determine page topic.',
          'Site structure, page speed, and mobile compatibility influence how well pages are indexed.',
          'Clear, well-organized content makes it easier for search engines to place your pages in relevant results.',
        ],
      },
      {
        heading: 'Strategic Optimisation for Discoverability',
        description: 'Effective SEO combines on-page, technical, and content strategies to improve search performance.',
        details: [
          'On-page SEO ensures your content is clearly labeled and focused on the right keywords.',
          'Technical SEO supports crawlability, mobile experience, and fast page loading.',
          'Metadata and content together make your pages more attractive to both search engines and users.',
        ],
      },
      {
        heading: 'The Long-Term Value of SEO',
        description: 'SEO builds durable visibility that continues generating traffic over time.',
        details: [
          'Organic search delivers consistent visitors without ongoing ad spend.',
          'High-ranking pages improve credibility and trust with potential customers.',
          'A well-optimized website can keep delivering value long after the initial work is complete.',
        ],
      },
    ],
    items: [
      {
        title: 'On-Page SEO',
        description: 'On-page SEO optimises individual pages to help search engines understand their content and topic. This includes optimising page titles to be clear and descriptive, structuring headings logically, writing focused content that thoroughly addresses the topic, and using relevant keywords naturally throughout the text. On-page optimisation also includes ensuring pages have clear purpose statements and that the information is well-organized. When pages are well-optimised, search engines can understand exactly what they are about and match them with relevant search queries.',
      },
      {
        title: 'Meta Tags & Descriptions',
        description: 'Meta tags and descriptions are HTML elements that tell search engines and visitors what a page is about. The page title is the most important—it appears in search results and browser tabs. The meta description is a brief summary that appears below the title in search results. These elements influence whether people click on your result when they see it in search. Well-written titles and descriptions that are both accurate and compelling increase click-through rates. They also help search engines understand page content and context. Meta optimisation directly impacts both search engine ranking and user engagement with your search results.',
      },
      {
        title: 'Search Engine Indexing',
        description: 'Indexing is the process of search engines including your website in their searchable database. Before a website can appear in search results, it must be discovered, crawled, and indexed. This happens automatically as search engine crawlers find and analyze your pages. However, you can expedite the process by submitting your website directly to search engines through Google Search Console and similar tools. Indexing verification ensures your pages are actually included in search results. If pages aren\'t indexed, they won\'t appear in search results regardless of how well-optimised they are. Proper indexing setup is foundational to SEO success.',
      },
    ],
  },
  {
    id: '5',
    slug: 'website-design-services',
    title: 'Website Design Services',
    subtitle: 'Strategic Digital Presence Development',
    description: 'Create websites that effectively communicate your value and drive business objectives through thoughtful design and functionality.',
    sections: [
      {
        heading: 'Definition',
        description: 'Website design services shape your online presence so it communicates value clearly and performs effectively.',
        details: [
          'Translate business goals and audience needs into a structured website experience.',
          'Combine visual design, user flows, and technical implementation into a cohesive product.',
          'Ensure the website communicates your brand with clarity and confidence.',
        ],
      },
      {
        heading: 'Why It Matters',
        description: 'A website that feels poorly designed weakens trust and reduces the impact of your message.',
        details: [
          'Confusing layouts and weak messaging make it harder for visitors to understand your offer.',
          'Inconsistent design across devices signals a lack of professionalism.',
          'Strong design builds credibility and supports user decisions at every step.',
        ],
      },
      {
        heading: 'How It Works',
        description: 'Our design process is grounded in discovery, structure, and quality execution.',
        details: [
          'Begin by defining objectives, audiences, and the website\'s core user journeys.',
          'Design the visual system, navigation, and content structure to support those journeys.',
          'Build the site with responsive, test-driven implementation that looks good on every screen.',
        ],
      },
      {
        heading: 'Impact / Benefits',
        description: 'Thoughtful design improves engagement, trust, and the effectiveness of your website.',
        details: [
          'Visitors are more likely to stay, explore, and act when the website feels clear and polished.',
          'Consistent design reduces friction and supports better conversion outcomes.',
          'A well-designed site reflects positively on your brand and strengthens market presence.',
        ],
      },
      {
        heading: 'Strategic Insight',
        description: 'We treat website design as a business tool that must balance aesthetics with measurable value.',
        details: [
          'Design decisions are guided by how they support key business outcomes, not just visual trends.',
          'We build systems that can scale as your website grows and evolves.',
          'Our approach anticipates future needs so the site remains relevant and easy to maintain.',
        ],
      },
      {
        heading: 'Conversion Section',
        description: 'Create a website that clearly expresses your value and helps visitors take the next step.',
        details: [
          'We shape your message and design to build confidence in your audience.',
          'We deliver a website that works hard for your business goals across desktop and mobile.',
          'We help you turn first impressions into meaningful engagement and action.',
        ],
      },
    ],
    items: [
      {
        title: 'Discovery and Strategy',
        description: 'Comprehensive analysis of business goals, audience needs, and competitive landscape to inform design direction.',
      },
      {
        title: 'User Experience Design',
        description: 'Creation of intuitive user flows, information architecture, and interaction design that serve user needs effectively.',
      },
      {
        title: 'Visual Design Systems',
        description: 'Development of cohesive visual languages, color schemes, typography, and design elements that reinforce brand identity.',
      },
      {
        title: 'Responsive Implementation',
        description: 'Technical development ensuring consistent experience across desktop, tablet, and mobile devices.',
      },
      {
        title: 'Quality Assurance',
        description: 'Rigorous testing of functionality, performance, and compatibility across different browsers and devices.',
      },
    ],
  },
  {
    id: '6',
    slug: 'business-automation-systems',
    title: 'Business Automation Systems',
    subtitle: 'Streamlining Operations Through Technology',
    description: 'Implement automated systems that reduce manual work, improve efficiency, and enable business scaling through intelligent process optimization.',
    sections: [
      {
        heading: 'Definition',
        description: 'Business automation systems use technology to reduce manual effort and make operations more predictable.',
        details: [
          'Automate repetitive workflows so people can focus on strategic work.',
          'Connect systems to move data automatically between tools and teams.',
          'Build consistency into processes so operations run reliably as volume grows.',
        ],
      },
      {
        heading: 'Why It Matters',
        description: 'Manual processes create errors, slow response times, and scaling challenges.',
        details: [
          'Repetitive tasks consume staff time without adding strategic value.',
          'Inconsistency in execution leads to quality issues and customer friction.',
          'Automation makes it easier to grow without adding the same volume of manual effort.',
        ],
      },
      {
        heading: 'How It Works',
        description: 'We identify automation opportunities, choose the right tools, and implement dependable workflows.',
        details: [
          'Analyze current processes to find repeatable work that can be automated.',
          'Design systems that integrate with your existing tools and business rules.',
          'Test and refine automation so it works smoothly for your team and customers.',
        ],
      },
      {
        heading: 'Impact / Benefits',
        description: 'Automation improves speed, accuracy, and capacity across operations.',
        details: [
          'Tasks complete faster and with fewer errors when they run automatically.',
          'Staff can shift from administrative work to higher-value responsibilities.',
          'The business becomes more scalable and easier to manage as demand increases.',
        ],
      },
      {
        heading: 'Strategic Insight',
        description: 'Good automation is flexible, integrated, and aligned with business priorities.',
        details: [
          'Avoid overly rigid automations that become brittle as your business changes.',
          'Connect automation to strategic goals like growth, reliability, and customer experience.',
          'Design systems that can adapt as processes evolve and new requirements emerge.',
        ],
      },
      {
        heading: 'Conversion Section',
        description: 'Implement automation that reduces friction and supports your growth goals.',
        details: [
          'We map your processes to identify the biggest automation opportunities.',
          'We deliver systems that free your team from repetitive tasks and improve accuracy.',
          'We help your operations scale more smoothly by making your workflows more reliable.',
        ],
      },
    ],
    items: [
      {
        title: 'Workflow Automation',
        description: 'Design and implementation of automated workflows that streamline business processes and reduce manual intervention.',
      },
      {
        title: 'Data Processing Systems',
        description: 'Automated systems for data collection, processing, and analysis to support informed business decision-making.',
      },
      {
        title: 'Customer Relationship Management',
        description: 'CRM automation for lead tracking, customer communication, and relationship management processes.',
      },
      {
        title: 'Operational Efficiency Tools',
        description: 'Implementation of tools that optimize inventory management, order processing, and operational workflows.',
      },
      {
        title: 'Integration and Monitoring',
        description: 'System integration and ongoing monitoring to ensure automated processes operate effectively and efficiently.',
      },
    ],
  },
];

export type ServicePreview = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
};

function normalizeSlug(slug: unknown) {
  return typeof slug === 'string' ? slug.trim().toLowerCase() : '';
}

export function getServicePreviews(): ServicePreview[] {
  return services.map(({ id, slug, title, subtitle }) => ({
    id,
    slug: normalizeSlug(slug),
    title,
    subtitle,
  }));
}

export function getServiceBySlug(slug: unknown): Service | undefined {
  const normalizedSlug = normalizeSlug(slug);
  if (!normalizedSlug) {
    return undefined;
  }

  return services.find((service) => normalizeSlug(service.slug) === normalizedSlug);
}

export function getAllServiceSlugs(): string[] {
  return services
    .map((service) => normalizeSlug(service.slug))
    .filter((slug): slug is string => slug.length > 0);
}

const invalidServiceSlugs = services.flatMap((service, index) => {
  const errors: string[] = [];

  if (!service.slug || typeof service.slug !== 'string') {
    errors.push(`Service at index ${index} is missing a slug.`);
  } else {
    if (service.slug !== service.slug.trim()) {
      errors.push(`Service slug for "${service.title}" must not include leading or trailing whitespace.`);
    }
    if (service.slug !== service.slug.toLowerCase()) {
      errors.push(`Service slug for "${service.title}" must be lowercase.`);
    }
    if (/\s/.test(service.slug)) {
      errors.push(`Service slug for "${service.title}" must not contain spaces.`);
    }
  }

  if (!service.title || typeof service.title !== 'string') {
    errors.push(`Service with slug "${service.slug}" is missing a title.`);
  }

  if (!Array.isArray(service.sections)) {
    errors.push(`Service with slug "${service.slug}" is missing the sections array.`);
  }

  return errors;
});

if (invalidServiceSlugs.length > 0) {
  throw new Error(`Invalid services configuration:\n${invalidServiceSlugs.join('\n')}`);
}
