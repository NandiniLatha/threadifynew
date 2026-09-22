-- 1. Synchronization Function
CREATE OR REPLACE FUNCTION public.sync_design_request_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    active_count INT;
    current_req_status public.request_status;
    req_ids UUID[];
    req_id UUID;
BEGIN
    -- Determine which request(s) need synchronization.
    -- For UPDATEs where request_id changes, both OLD and NEW must be synced.
    -- To eliminate deadlock vulnerabilities, we sort the UUIDs to guarantee deterministic lock ordering.
    IF TG_OP = 'INSERT' THEN
        req_ids := ARRAY[NEW.request_id];
    ELSIF TG_OP = 'DELETE' THEN
        req_ids := ARRAY[OLD.request_id];
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.request_id = NEW.request_id THEN
            req_ids := ARRAY[NEW.request_id];
        ELSE
            IF OLD.request_id < NEW.request_id THEN
                req_ids := ARRAY[OLD.request_id, NEW.request_id];
            ELSE
                req_ids := ARRAY[NEW.request_id, OLD.request_id];
            END IF;
        END IF;
    END IF;

    -- Process each affected request_id sequentially in the sorted order
    FOREACH req_id IN ARRAY req_ids
    LOOP
        -- Serialize concurrent transactions via row lock for this specific request
        SELECT status INTO current_req_status
        FROM public.design_requests
        WHERE id = req_id
        FOR UPDATE;

        IF FOUND THEN
            -- Calculate active quotations for this request
            SELECT count(*) INTO active_count
            FROM public.quotations
            WHERE request_id = req_id
              AND status IN ('pending', 'accepted');

            -- Safe atomic status synchronization strictly for allowed statuses
            IF active_count > 0 AND current_req_status = 'pending_bids' THEN
                UPDATE public.design_requests 
                SET status = 'quoted' 
                WHERE id = req_id;
                
            ELSIF active_count = 0 AND current_req_status = 'quoted' THEN
                UPDATE public.design_requests 
                SET status = 'pending_bids' 
                WHERE id = req_id;
            END IF;
        END IF;
    END LOOP;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 2. Lock down execution privileges
REVOKE ALL ON FUNCTION public.sync_design_request_status() FROM PUBLIC;

-- 3. Synchronization Triggers

-- Handle INSERT
DROP TRIGGER IF EXISTS trg_sync_design_request_status_insert ON public.quotations;
CREATE TRIGGER trg_sync_design_request_status_insert
AFTER INSERT ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.sync_design_request_status();

-- Handle DELETE
DROP TRIGGER IF EXISTS trg_sync_design_request_status_delete ON public.quotations;
CREATE TRIGGER trg_sync_design_request_status_delete
AFTER DELETE ON public.quotations
FOR EACH ROW
EXECUTE FUNCTION public.sync_design_request_status();

-- Handle UPDATE (covers status and request_id changes safely)
DROP TRIGGER IF EXISTS trg_sync_design_request_status_update ON public.quotations;
CREATE TRIGGER trg_sync_design_request_status_update
AFTER UPDATE OF status, request_id ON public.quotations
FOR EACH ROW
WHEN (OLD.status IS DISTINCT FROM NEW.status OR OLD.request_id IS DISTINCT FROM NEW.request_id)
EXECUTE FUNCTION public.sync_design_request_status();
