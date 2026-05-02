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
export declare const services: Service[];
export type ServicePreview = {
    id: string;
    slug: string;
    title: string;
    subtitle: string;
};
export declare function getServicePreviews(): ServicePreview[];
export declare function getServiceBySlug(slug: unknown): Service | undefined;
export declare function getAllServiceSlugs(): string[];
//# sourceMappingURL=services.d.ts.map