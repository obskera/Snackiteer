import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { VendingMachine } from "@/components/vendingMachine/VendingMachine";
import {
    createMachineState,
    createItemInstance,
    getSlot,
} from "@/logic/snack";
import { STARTER_ITEM_DEFS } from "@/logic/snack/itemDefs";

describe("VendingMachine", () => {
    const defaultProps = () => ({
        slots: createMachineState().slots,
        coins: 20,
        round: 1,
        rent: 5,
        machineHp: 100,
        maxMachineHp: 100,
        selectedSlotPos: null,
        onSlotClick: vi.fn(),
    });

    it("renders 9 slot elements (3 unlocked + 6 locked)", () => {
        const { container } = render(<VendingMachine {...defaultProps()} />);
        const slots = container.querySelectorAll(".vm-slot");
        expect(slots).toHaveLength(9);

        const locked = container.querySelectorAll(".vm-slot--locked");
        expect(locked).toHaveLength(6);
    });

    it("displays coins, round, and rent", () => {
        render(<VendingMachine {...defaultProps()} />);
        expect(screen.getByText("20¢")).toBeTruthy();
        expect(screen.getByText("Round 1")).toBeTruthy();
        expect(screen.getByText("Rent: 5¢")).toBeTruthy();
    });

    it("displays item name and price in a filled slot", () => {
        const machine = createMachineState();
        const soda = createItemInstance(STARTER_ITEM_DEFS[0], "common");
        soda.price = 5;
        getSlot(machine, 0, 0)!.item = soda;

        render(
            <VendingMachine
                {...defaultProps()}
                slots={machine.slots}
            />,
        );
        expect(screen.getByText("Soda Can")).toBeTruthy();
        expect(screen.getByText("5¢")).toBeTruthy();
    });

    it("calls onSlotClick when an unlocked slot is clicked", () => {
        const onClick = vi.fn();
        const { container } = render(
            <VendingMachine {...defaultProps()} onSlotClick={onClick} />,
        );
        const unlockedSlots = container.querySelectorAll(
            ".vm-slot:not(.vm-slot--locked)",
        );
        fireEvent.click(unlockedSlots[0]);
        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onClick.mock.calls[0][0].position).toEqual({ row: 0, col: 0 });
    });

    it("does not call onSlotClick for locked slots", () => {
        const onClick = vi.fn();
        const { container } = render(
            <VendingMachine {...defaultProps()} onSlotClick={onClick} />,
        );
        const lockedSlots = container.querySelectorAll(".vm-slot--locked");
        fireEvent.click(lockedSlots[0]);
        expect(onClick).not.toHaveBeenCalled();
    });

    it("shows featured marker on featured slot", () => {
        const machine = createMachineState();
        getSlot(machine, 0, 1)!.featured = true;

        const { container } = render(
            <VendingMachine {...defaultProps()} slots={machine.slots} />,
        );
        const featured = container.querySelectorAll(".vm-slot--featured");
        expect(featured).toHaveLength(1);
    });

    it("applies rarity class to items", () => {
        const machine = createMachineState();
        const rare = createItemInstance(STARTER_ITEM_DEFS[0], "fancy");
        getSlot(machine, 0, 0)!.item = rare;

        const { container } = render(
            <VendingMachine {...defaultProps()} slots={machine.slots} />,
        );
        expect(container.querySelector(".vm-item--fancy")).toBeTruthy();
    });
});
