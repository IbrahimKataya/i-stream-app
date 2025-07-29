import { useEffect, useState } from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { getUserFriends, getRecommendedUsers, getOutgoingFriendReqs, sendFriendRequest } from "../lib/api";
import { Link } from "react-router";
import { Users2Icon } from "lucide-react";

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());

  const {data: friends=[], isLoading: loadingFriends} = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends
  });

  const {data: recommendedUsers=[], isLoading: loadingRecommendedUsers} = useQuery({
    queryKey: ["recommendedUsers"],
    queryFn: getRecommendedUsers
  })

  const {data: outgoingFriendReqs}  = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs
  })

  const {mutate: sendRequestMutation, isPending: pendingFriendRequest}  = useMutation({
    mutateFn: sendFriendRequest,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] })
  })

  useEffect(() => {
    const outgoingIds = new Set()
    if(outgoingFriendReqs && outgoingFriendReqs.legth > 0){
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.id)
      })
      setOutgoingRequestsIds(outgoingIds)
    }
  },[outgoingFriendReqs])

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="container mx-auto space-y-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Friends</h2>
            <Link to="/notifications" className="btn btn-outline btn-sm">
              <Users2Icon className="mr-2 size-4"/>
              Friend Requests
            </Link>
        </div>
      </div>
    </div>
  )
}

export default HomePage