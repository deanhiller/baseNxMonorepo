export interface ContactEmail {
    email: string;
    label: string;
}

export interface ContactPhoneNumber {
    country: string;
    phoneNumber: string;
    label: string;
}

export interface Contact {
    id: string;
    avatar?: string | null;
    background?: string | null;
    name: string;
    emails?: ContactEmail[];
    phoneNumbers?: ContactPhoneNumber[];
    title?: string;
    company?: string;
    birthday?: string | null;
    address?: string | null;
    notes?: string | null;
    tags: string[];
}

export interface Country {
    id: string;
    iso: string;
    name: string;
    code: string;
    flagImagePos: string;
}

export interface Tag {
    id?: string;
    title?: string;
}
