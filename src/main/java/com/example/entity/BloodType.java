package com.example.entity;

public enum BloodType {
    A_POS("A+"), A_NEG("A-"),
    B_POS("B+"), B_NEG("B-"),
    AB_POS("AB+"), AB_NEG("AB-"),
    O_POS("O+"), O_NEG("O-");

    private final String label;

    BloodType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }
}
